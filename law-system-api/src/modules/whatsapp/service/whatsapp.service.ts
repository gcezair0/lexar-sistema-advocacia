/**
 * WhatsApp Connection Service using Baileys
 *
 * Gerencia a conexão com WhatsApp via Baileys.
 * Gera QR Code no terminal, recebe e envia mensagens.
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import path from 'path'
import fs from 'fs/promises'
import { BotFlowService, BotResponse } from './bot-flow.service'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const qrcode = require('qrcode-terminal')

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

/**
 * ⚡ BOTÕES INTERATIVOS (experimental via Baileys)
 * Mude para false se os botões não aparecerem ou causar problemas.
 * O bot automaticamente usa texto formatado como fallback.
 */
const USE_INTERACTIVE_BUTTONS = false

/**
 * Mapeia phone normalizado → JID real do WhatsApp
 * (pode ser 123@lid ou 123@s.whatsapp.net dependendo da versão)
 */
const phoneToJid = new Map<string, string>()

/** Extrai apenas dígitos do JID para usar como chave */
function normalizePhone(jid: string): string {
  return jid.replace(/@.+$/, '').replace(/\D/g, '')
}

export class WhatsAppService {
  private static instance: WhatsAppService | null = null

  private sock: WASocket | null = null
  private botFlow = new BotFlowService()
  private defaultOfficeId: string
  private status: ConnectionStatus = 'disconnected'
  private qrCode: string | null = null
  private authDir: string

  constructor(officeId: string) {
    this.defaultOfficeId = officeId
    this.authDir = path.resolve(process.cwd(), 'auth_info', officeId)
  }

  /**
   * Singleton — uma instância por officeId
   */
  static getInstance(officeId: string): WhatsAppService {
    if (!WhatsAppService.instance || WhatsAppService.instance.defaultOfficeId !== officeId) {
      WhatsAppService.instance = new WhatsAppService(officeId)
    }
    return WhatsAppService.instance
  }

  /**
   * Conectar ao WhatsApp.
   * Ao chamar, um QR Code aparece no terminal.
   * Escaneie com seu WhatsApp para autenticar.
   */
  async connect(): Promise<void> {
    if (this.status === 'connected') {
      console.log('✅ WhatsApp já está conectado!')
      return
    }

    this.status = 'connecting'
    console.log('📱 Iniciando conexão com WhatsApp...')

    const { state, saveCreds } = await useMultiFileAuthState(this.authDir)
    const { version } = await fetchLatestBaileysVersion()

    this.sock = makeWASocket({
      version,
      auth: state,
      browser: ['Lexar Advocacia', 'Chrome', '1.0.0'],
    })

    // Salvar credenciais quando atualizadas
    this.sock.ev.on('creds.update', saveCreds)

    // Eventos de conexão
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        this.qrCode = qr
        this.status = 'connecting'
        console.log('\n📱 ============================================')
        console.log('   ESCANEIE O QR CODE ABAIXO COM SEU WHATSAPP')
        console.log('   WhatsApp > Menu > Aparelhos conectados')
        console.log('   ============================================\n')
        qrcode.generate(qr, { small: true })
        console.log('')
      }

      if (connection === 'close') {
        this.qrCode = null

        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode

        console.log(`❌ Conexão fechada. Motivo: ${reason}`)

        if (reason === DisconnectReason.loggedOut || reason === 401) {
          // Sessão expirada/invalidada — limpar tudo
          this.status = 'disconnected'
          this.sock = null
          console.log('🗑️  Sessão expirada. Limpando dados antigos...')
          await fs.rm(this.authDir, { recursive: true, force: true }).catch(() => {})
          console.log('🔄 Reconectando para gerar novo QR Code...')
          setTimeout(() => this.connect(), 2000)
        } else {
          // Reconexão automática — manter sock até o novo estar pronto
          this.status = 'connecting'
          console.log('🔄 Reconectando...')
          setTimeout(() => this.connect(), 3000)
        }
      }

      if (connection === 'open') {
        this.status = 'connected'
        this.qrCode = null
        console.log('✅ WhatsApp conectado com sucesso!')
        console.log('🤖 Bot de atendimento ativo.')
      }
    })

    // Receber mensagens
    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return

      for (const msg of messages) {
        // Ignorar mensagens enviadas por nós
        if (msg.key.fromMe) continue
        // Ignorar status/stories
        if (msg.key.remoteJid === 'status@broadcast') continue
        // Ignorar mensagens de grupos (apenas conversas privadas)
        if (msg.key.remoteJid?.endsWith('@g.us')) continue
        // Ignorar newsletters
        if (msg.key.remoteJid?.endsWith('@newsletter')) continue

        console.log(`📨 Mensagem recebida de: ${msg.key.remoteJid}`, JSON.stringify(Object.keys(msg.message || {})))

        await this.handleIncomingMessage(msg)
      }
    })
  }

  /**
   * Desconectar do WhatsApp
   */
  async disconnect(): Promise<void> {
    if (this.sock) {
      await this.sock.logout()
      this.sock = null
      this.status = 'disconnected'
      this.qrCode = null
      console.log('📱 WhatsApp desconectado.')
    }
  }

  /**
   * Retorna o status atual da conexão e o QR code (se disponível)
   */
  getStatus() {
    return {
      status: this.status,
      qrCode: this.qrCode,
      officeId: this.defaultOfficeId,
    }
  }

  /**
   * Processar mensagem recebida pelo bot
   */
  private async handleIncomingMessage(msg: any) {
    const rawJid = msg.key.remoteJid || ''
    const phone = normalizePhone(rawJid)

    // Guardar mapeamento phone → JID real para responder corretamente
    if (rawJid && phone) {
      phoneToJid.set(phone, rawJid)
    }

    // Captura texto de mensagens normais, botões clicados ou itens de lista
    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.buttonsResponseMessage?.selectedButtonId ||
      msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.message?.templateButtonReplyMessage?.selectedId ||
      this.extractInteractiveResponse(msg) ||
      ''

    if (!phone) return

    // Se não tem texto (áudio, imagem, sticker, protocolMessage, etc.)
    if (!text) {
      const msgTypes = Object.keys(msg.message || {})
      // Mensagens de sistema — ignorar silenciosamente
      const systemTypes = ['protocolMessage', 'senderKeyDistributionMessage', 'messageContextInfo', 'reactionMessage']
      const isSystemMsg = msgTypes.every((t) => systemTypes.includes(t))
      if (isSystemMsg) {
        return
      }
      console.log(`📩 Mensagem não-texto de ${phone} (tipo: ${msgTypes.join(', ')})`)
      await this.sendTextToJid(rawJid, '👋 Olá! No momento consigo entender apenas mensagens de texto. Por favor, digite sua mensagem.')
      return
    }

    console.log(`📩 Mensagem de ${phone}: ${text}`)

    try {
      const responses = await this.botFlow.handleMessage(
        phone,
        text,
        this.defaultOfficeId
      )

      if (responses.length === 0) {
        console.log(`ℹ️ Nenhuma resposta do bot para ${phone} (sessão HUMAN ou vazia)`)
        return
      }

      for (const response of responses) {
        await this.sendBotResponse(rawJid, response)
        // Pequeno delay entre mensagens para não ser bloqueado
        await new Promise((r) => setTimeout(r, 500))
      }
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem de ${phone}:`, error)
      await this.sendTextToJid(rawJid, '⚠️ Desculpe, ocorreu um erro no atendimento. Por favor, tente novamente em alguns instantes.').catch(() => {})
    }
  }

  /**
   * Envia uma resposta do bot — tenta botões interativos, fallback para texto
   */
  private async sendBotResponse(jid: string, response: BotResponse): Promise<void> {
    if (response.type === 'text') {
      await this.sendTextToJid(jid, response.text)
    } else if (response.type === 'buttons') {
      await this.sendButtonsToJid(jid, response.body, response.buttons, response.footer)
    }
  }

  /**
   * Extrair resposta de botões interativos (nativeFlowMessage)
   */
  private extractInteractiveResponse(msg: any): string | null {
    try {
      const interactive =
        msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
      if (interactive) {
        const parsed = JSON.parse(interactive)
        return parsed.id || null
      }
    } catch {}
    return null
  }

  /**
   * Enviar mensagem de texto direto para um JID (formato real do WhatsApp)
   */
  private async sendTextToJid(jid: string, text: string): Promise<void> {
    if (!this.sock) {
      console.log(`📤 [Sem socket] Para: ${jid} | Msg: ${text.substring(0, 50)}`)
      return
    }

    try {
      await this.sock.sendMessage(jid, { text })
      console.log(`📤 Enviado para ${jid}: ${text.substring(0, 50)}...`)
    } catch (error: any) {
      console.error(`❌ Erro ao enviar para ${jid}:`, error.message)
    }
  }

  /**
   * Enviar botões interativos (experimental)
   * Se falhar, envia como texto formatado automaticamente
   */
  private async sendButtonsToJid(
    jid: string,
    body: string,
    buttons: { id: string; text: string }[],
    footer?: string,
  ): Promise<void> {
    if (!this.sock) return

    if (!USE_INTERACTIVE_BUTTONS) {
      // Fallback: texto formatado
      const btnText = buttons.map((b) => `▸ *${b.id}* - ${b.text}`).join('\n')
      await this.sendTextToJid(jid, `${body}\n\n${btnText}${footer ? `\n\n_${footer}_` : ''}`)
      return
    }

    try {
      const interactiveMsg = {
        interactiveMessage: {
          header: { hasMediaAttachment: false },
          body: { text: body },
          footer: footer ? { text: footer } : undefined,
          nativeFlowMessage: {
            buttons: buttons.map((b) => ({
              name: 'quick_reply',
              buttonParamsJson: JSON.stringify({
                display_text: b.text,
                id: b.id,
              }),
            })),
          },
        },
      }

      await this.sock.sendMessage(jid, interactiveMsg as any)
      console.log(`📤 Botões para ${jid}: ${body.substring(0, 50)}...`)
    } catch (error: any) {
      console.warn(`⚠️ Botões falharam para ${jid}, usando fallback texto:`, error.message)
      const btnText = buttons.map((b) => `▸ *${b.id}* - ${b.text}`).join('\n')
      await this.sendTextToJid(jid, `${body}\n\n${btnText}${footer ? `\n\n_${footer}_` : ''}`)
    }
  }

  /**
   * Enviar mensagem de texto por número de telefone (busca JID salvo ou usa @s.whatsapp.net)
   */
  async sendMessage(phone: string, message: string): Promise<void> {
    const normalized = phone.replace(/\D/g, '')
    const jid = phoneToJid.get(normalized) || `${normalized}@s.whatsapp.net`
    await this.sendTextToJid(jid, message)
  }

  /**
   * Enviar notificação de atualização de processo
   */
  async sendProcessUpdate(phone: string, processNumber: string, update: string) {
    const message =
      `⚖️ *Atualização do Processo*\n\n` +
      `📋 Processo: ${processNumber}\n` +
      `📌 ${update}\n\n` +
      `Para mais detalhes, entre em contato conosco.`

    await this.sendMessage(phone, message)
  }

  /**
   * Enviar lembrete de audiência
   */
  async sendHearingReminder(
    phone: string,
    hearingData: { title: string; date: string; location?: string }
  ) {
    const message =
      `📅 *Lembrete de Audiência*\n\n` +
      `📋 ${hearingData.title}\n` +
      `🕐 Data: ${hearingData.date}\n` +
      (hearingData.location ? `📍 Local: ${hearingData.location}\n` : '') +
      `\nNão se esqueça! Qualquer dúvida, estamos à disposição.`

    await this.sendMessage(phone, message)
  }
}

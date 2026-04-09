/**
 * WhatsApp Bot Flow Handler
 *
 * Manages automatic conversation flows:
 * 1. Welcome + Menu
 * 2. Process consultation (by CPF or process number)
 * 3. Lead capture
 * 4. Document reception
 * 5. Human transfer
 */

import { ProcessRepository } from '../../processes/repository/process.repository'
import { ClientRepository } from '../../clients/repository/client.repository'
import { ChatRepository } from '../../chat/repository/chat.repository'
import { LeadRepository } from '../repository/lead.repository'

/** Mensagem de texto simples */
export interface BotTextResponse {
  type: 'text'
  text: string
}

/** Mensagem com botões clicáveis */
export interface BotButtonsResponse {
  type: 'buttons'
  body: string
  footer?: string
  buttons: { id: string; text: string }[]
  /** Texto fallback caso os botões não funcionem */
  fallbackText: string
}

export type BotResponse = BotTextResponse | BotButtonsResponse

interface BotContext {
  sessionId: string
  phone: string
  officeId: string
  currentStep: string
  data: Record<string, string>
}

// In-memory context store (in production, use Redis)
const contexts = new Map<string, BotContext>()

export class BotFlowService {
  private processRepo = new ProcessRepository()
  private clientRepo = new ClientRepository()
  private chatRepo = new ChatRepository()
  private leadRepo = new LeadRepository()

  async handleMessage(
    phone: string,
    message: string,
    officeId: string
  ): Promise<BotResponse[]> {
    // Normalizar telefone
    const normalizedPhone = phone.replace(/\D/g, '')

    console.log(`🤖 Bot processando mensagem de ${normalizedPhone}: "${message}"`)

    // Get or create session
    let session = await this.chatRepo.findSessionByPhone(normalizedPhone, officeId)

    if (!session) {
      console.log(`🆕 Criando nova sessão para ${normalizedPhone}`)
      const client = await this.clientRepo.findByPhone(normalizedPhone, officeId)

      session = await this.chatRepo.createSession({
        phone: normalizedPhone,
        officeId,
        clientId: client?.id || undefined,
        status: 'BOT',
      })
      console.log(`✅ Sessão criada: ${session.id}`)
    } else {
      console.log(`📋 Sessão existente: ${session.id} (status: ${session.status})`)
    }

    // If session is in HUMAN mode, don't process with bot
    if (session.status === 'HUMAN') {
      await this.chatRepo.addMessage({
        content: message,
        fromBot: false,
        sessionId: session.id,
      })
      return []
    }

    // Save incoming message
    await this.chatRepo.addMessage({
      content: message,
      fromBot: false,
      sessionId: session.id,
    })

    // Get bot context
    let context = contexts.get(normalizedPhone)

    if (!context) {
      context = {
        sessionId: session.id,
        phone: normalizedPhone,
        officeId,
        currentStep: 'welcome',
        data: {},
      }
      contexts.set(normalizedPhone, context)
    }

    const responses = await this.processStep(context, message)

    // Save bot responses for chat history
    for (const response of responses) {
      const text = response.type === 'text' ? response.text : response.fallbackText
      await this.chatRepo.addMessage({
        content: text,
        fromBot: true,
        sessionId: session.id,
      })
    }

    return responses
  }

  private async processStep(
    context: BotContext,
    message: string
  ): Promise<BotResponse[]> {
    const text = message.trim().toLowerCase()

    switch (context.currentStep) {
      case 'welcome':
        return this.handleWelcome(context)

      case 'menu':
        return this.handleMenu(context, text)

      case 'process_query':
        return this.handleProcessQuery(context, text)

      case 'lead_name':
        return this.handleLeadName(context, message)

      case 'lead_issue':
        return this.handleLeadIssue(context, message)

      case 'document_wait':
        return this.handleDocumentWait(context, text)

      default:
        return this.handleWelcome(context)
    }
  }

  /** Menu principal com botões */
  private menuButtons(): BotButtonsResponse {
    return {
      type: 'buttons',
      body: 'Como posso ajudá-lo? Escolha uma opção:',
      footer: 'Lexar Advocacia',
      buttons: [
        { id: '1', text: '🧑‍💼 Falar com atendente' },
        { id: '2', text: '🔍 Consultar processo' },
        { id: '3', text: '📄 Enviar documentos' },
        { id: '4', text: '📝 Informações gerais' },
      ],
      fallbackText:
        'Como posso ajudá-lo? *Digite o número* da opção:\n\n' +
        '1️⃣ Falar com um atendente\n' +
        '2️⃣ Consultar andamento de processo\n' +
        '3️⃣ Enviar documentos\n' +
        '4️⃣ Informações gerais\n\n' +
        '_Lexar Advocacia_',
    }
  }

  private handleWelcome(context: BotContext): BotResponse[] {
    context.currentStep = 'menu'
    contexts.set(context.phone, context)

    return [
      { type: 'text', text: '👋 Olá! Bem-vindo ao *Lexar Advocacia*.' },
      this.menuButtons(),
    ]
  }

  private async handleMenu(
    context: BotContext,
    text: string
  ): Promise<BotResponse[]> {
    switch (text) {
      case '1': {
        await this.chatRepo.updateSessionStatus(context.sessionId, 'HUMAN')
        contexts.delete(context.phone)
        return [
          { type: 'text', text: '🧑‍💼 Certo! Vou transferir você para um de nossos atendentes.\n\nPor favor, aguarde um momento. Um profissional irá atendê-lo em breve.' },
        ]
      }

      case '2': {
        context.currentStep = 'process_query'
        contexts.set(context.phone, context)
        return [
          { type: 'text', text: '🔍 Para consultar seu processo, envie seu *CPF* ou o *número do processo*.' },
        ]
      }

      case '3': {
        context.currentStep = 'document_wait'
        contexts.set(context.phone, context)
        return [
          { type: 'text', text: '📄 Por favor, envie o documento (foto, PDF ou arquivo).\n\nEle será vinculado ao seu cadastro automaticamente.' },
        ]
      }

      case '4': {
        context.currentStep = 'lead_name'
        contexts.set(context.phone, context)
        return [
          { type: 'text', text: '📝 Vamos coletar algumas informações para melhor atendê-lo.\n\nQual é o seu *nome completo*?' },
        ]
      }

      default:
        return [
          { type: 'text', text: '❌ Opção inválida.' },
          this.menuButtons(),
        ]
    }
  }

  private async handleProcessQuery(
    context: BotContext,
    text: string
  ): Promise<BotResponse[]> {
    const processes = await this.processRepo.findByClientCpf(text)

    if (processes.length > 0) {
      const processInfo = processes
        .map(
          (p) =>
            `📋 *Processo:* ${p.number}\n` +
            `📌 *Status:* ${p.status}\n` +
            `📅 *Última movimentação:* ${
              p.movements[0]?.title || 'Sem movimentações'
            }`
        )
        .join('\n\n---\n\n')

      context.currentStep = 'menu'
      contexts.set(context.phone, context)

      return [
        { type: 'text', text: `✅ Encontramos ${processes.length} processo(s):\n\n${processInfo}` },
        this.menuButtons(),
      ]
    }

    context.currentStep = 'menu'
    contexts.set(context.phone, context)

    return [
      { type: 'text', text: '❌ Nenhum processo encontrado com esse CPF/número.' },
      {
        type: 'buttons',
        body: 'O que deseja fazer?',
        footer: 'Lexar Advocacia',
        buttons: [
          { id: '2', text: '🔍 Tentar novamente' },
          { id: '1', text: '🧑‍💼 Falar com atendente' },
        ],
        fallbackText:
          'O que deseja fazer?\n\n' +
          '1️⃣ Falar com um atendente\n' +
          '2️⃣ Tentar novamente\n\n' +
          '_Lexar Advocacia_',
      },
    ]
  }

  private async handleLeadName(
    context: BotContext,
    name: string
  ): Promise<BotResponse[]> {
    context.data.name = name
    context.currentStep = 'lead_issue'
    contexts.set(context.phone, context)

    return [
      { type: 'text', text: `Obrigado, *${name}*! 📝` },
      {
        type: 'buttons',
        body: 'Qual é a sua *área de interesse*?',
        footer: 'Selecione ou digite livremente',
        buttons: [
          { id: 'area_1', text: '👷 Trabalhista' },
          { id: 'area_2', text: '👨‍👩‍👧 Família' },
          { id: 'area_3', text: '📜 Cível' },
          { id: 'area_4', text: '⚖️ Criminal' },
        ],
        fallbackText:
          'Qual é a sua *área de interesse*? Digite o número:\n\n' +
          '1️⃣ 👷 Direito Trabalhista\n' +
          '2️⃣ 👨‍👩‍👧 Direito de Família\n' +
          '3️⃣ 📜 Direito Cível\n' +
          '4️⃣ ⚖️ Direito Criminal\n' +
          '5️⃣ 🛒 Direito do Consumidor\n' +
          '6️⃣ 📋 Outro\n\n' +
          '_Ou digite livremente o seu problema._',
      },
    ]
  }

  private async handleLeadIssue(
    context: BotContext,
    issue: string
  ): Promise<BotResponse[]> {
    const areaMap: Record<string, string> = {
      '1': 'Direito Trabalhista',
      'area_1': 'Direito Trabalhista',
      '2': 'Direito de Família',
      'area_2': 'Direito de Família',
      '3': 'Direito Cível',
      'area_3': 'Direito Cível',
      '4': 'Direito Criminal',
      'area_4': 'Direito Criminal',
      '5': 'Direito do Consumidor',
      '6': 'Outro',
    }

    const legalIssue = areaMap[issue.trim().toLowerCase()] || issue

    await this.leadRepo.create({
      name: context.data.name,
      phone: context.phone,
      legalIssue,
      source: 'whatsapp',
      officeId: context.officeId,
    })

    context.currentStep = 'menu'
    contexts.set(context.phone, context)

    return [
      { type: 'text', text: '✅ Suas informações foram registradas com sucesso!\n\nUm de nossos advogados entrará em contato em breve.' },
      this.menuButtons(),
    ]
  }

  private handleDocumentWait(
    context: BotContext,
    _text: string
  ): BotResponse[] {
    context.currentStep = 'menu'
    contexts.set(context.phone, context)

    return [
      { type: 'text', text: '📎 Documento recebido! Será processado e vinculado ao seu cadastro.' },
      this.menuButtons(),
    ]
  }

  clearContext(phone: string) {
    contexts.delete(phone)
  }
}

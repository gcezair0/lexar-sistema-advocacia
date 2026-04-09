'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Clock, FileText, User, Scale } from 'lucide-react'

interface Movement {
  id: string
  title: string
  description: string | null
  date: string
  type: string
  createdAt: string
}

interface ProcessDetail {
  id: string
  number: string
  title: string
  description: string | null
  type: string
  status: string
  court: string | null
  branch: string | null
  value: number | null
  client: { id: string; name: string }
  responsible: { id: string; name: string }
  movements: Movement[]
  createdAt: string
}

interface Props {
  open: boolean
  onClose: () => void
  processId: string | null
}

const statusMap: Record<string, { label: string; variant: string }> = {
  ACTIVE: { label: 'Ativo', variant: 'success' },
  PENDING: { label: 'Pendente', variant: 'warning' },
  CLOSED: { label: 'Encerrado', variant: 'secondary' },
  ARCHIVED: { label: 'Arquivado', variant: 'secondary' },
  SUSPENDED: { label: 'Suspenso', variant: 'destructive' },
}

export function ProcessDetailDialog({ open, onClose, processId }: Props) {
  const [process, setProcess] = useState<ProcessDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && processId) {
      setLoading(true)
      api.get(`/processes/${processId}`)
        .then(({ data }) => setProcess(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open, processId])

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Detalhes do Processo</DialogTitle>
        <DialogClose onClose={onClose} />
      </DialogHeader>

      <DialogContent>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : process ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{process.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{process.number}</p>
              </div>
              <Badge variant={statusMap[process.status]?.variant as 'success' | 'warning' | 'secondary' | 'destructive'}>
                {statusMap[process.status]?.label || process.status}
              </Badge>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium">{process.client.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Responsável</p>
                  <p className="font-medium">{process.responsible.name}</p>
                </div>
              </div>
              {process.court && (
                <div>
                  <p className="text-gray-500">Tribunal</p>
                  <p className="font-medium">{process.court}</p>
                </div>
              )}
              {process.branch && (
                <div>
                  <p className="text-gray-500">Vara</p>
                  <p className="font-medium">{process.branch}</p>
                </div>
              )}
              {process.value && (
                <div>
                  <p className="text-gray-500">Valor da causa</p>
                  <p className="font-medium">R$ {process.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>

            {process.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Descrição</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{process.description}</p>
              </div>
            )}

            {/* Movements Timeline */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Movimentações
              </h4>
              {process.movements && process.movements.length > 0 ? (
                <div className="space-y-3">
                  {process.movements.map((mov, i) => (
                    <div key={mov.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                        {i < process.movements.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-gray-900">{mov.title}</p>
                        {mov.description && <p className="text-xs text-gray-500 mt-0.5">{mov.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(mov.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-3 text-center">Nenhuma movimentação registrada</p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

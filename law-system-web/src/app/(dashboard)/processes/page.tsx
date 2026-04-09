'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTable, Pagination } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { ProcessFormDialog } from './process-form-dialog'
import { ProcessDetailDialog } from './process-detail-dialog'

interface Process {
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
  createdAt: string
}

const statusMap: Record<string, { label: string; variant: string }> = {
  ACTIVE: { label: 'Ativo', variant: 'success' },
  PENDING: { label: 'Pendente', variant: 'warning' },
  CLOSED: { label: 'Encerrado', variant: 'secondary' },
  ARCHIVED: { label: 'Arquivado', variant: 'secondary' },
  SUSPENDED: { label: 'Suspenso', variant: 'destructive' },
}

const typeMap: Record<string, string> = {
  CIVIL: 'Cível',
  CRIMINAL: 'Criminal',
  LABOR: 'Trabalhista',
  TAX: 'Tributário',
  ADMINISTRATIVE: 'Administrativo',
  FAMILY: 'Família',
  CONSUMER: 'Consumidor',
  ENVIRONMENTAL: 'Ambiental',
  OTHER: 'Outro',
}

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<Process | null>(null)
  const [detailProcess, setDetailProcess] = useState<Process | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/processes', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          status: statusFilter || undefined,
        },
      })
      setProcesses(data.data || data.processes || data)
      setTotalPages(data.totalPages || 1)
    } catch {
      toast({ type: 'error', title: 'Erro ao carregar processos' })
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  function handleEdit(proc: Process) {
    setEditingProcess(proc)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este processo?')) return
    try {
      await api.delete(`/processes/${id}`)
      toast({ type: 'success', title: 'Processo excluído' })
      load()
    } catch {
      toast({ type: 'error', title: 'Erro ao excluir processo' })
    }
  }

  const columns = [
    {
      key: 'number',
      header: 'Número / Título',
      render: (p: Process) => (
        <div className="cursor-pointer" onClick={() => setDetailProcess(p)}>
          <p className="font-medium text-blue-600 hover:underline">{p.number}</p>
          <p className="text-xs text-gray-500 truncate max-w-[200px]">{p.title}</p>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (p: Process) => <span className="text-sm">{p.client.name}</span>,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (p: Process) => <span className="text-sm">{typeMap[p.type] || p.type}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: Process) => {
        const s = statusMap[p.status] || { label: p.status, variant: 'secondary' }
        return <Badge variant={s.variant as 'success' | 'warning' | 'secondary' | 'destructive'}>{s.label}</Badge>
      },
    },
    {
      key: 'responsible',
      header: 'Responsável',
      render: (p: Process) => <span className="text-sm text-gray-600">{p.responsible.name}</span>,
    },
    {
      key: 'createdAt',
      header: 'Criado em',
      render: (p: Process) => <span className="text-sm text-gray-500">{formatDate(p.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (p: Process) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>Editar</Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(p.id)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os processos do escritório</p>
        </div>
        <Button onClick={() => { setEditingProcess(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Processo
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por número ou título..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'Todos os status' },
            { value: 'ACTIVE', label: 'Ativo' },
            { value: 'PENDING', label: 'Pendente' },
            { value: 'CLOSED', label: 'Encerrado' },
            { value: 'SUSPENDED', label: 'Suspenso' },
            { value: 'ARCHIVED', label: 'Arquivado' },
          ]}
          className="w-48"
        />
      </div>

      {!loading && processes.length === 0 && !search && !statusFilter ? (
        <EmptyState
          icon={<Scale className="h-12 w-12" />}
          title="Nenhum processo cadastrado"
          description="Adicione seu primeiro processo para começar."
          action={<Button onClick={() => { setEditingProcess(null); setFormOpen(true) }}><Plus className="h-4 w-4 mr-2" /> Novo Processo</Button>}
        />
      ) : (
        <>
          <DataTable columns={columns} data={processes} keyExtractor={(p) => p.id} loading={loading} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ProcessFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingProcess(null) }}
        process={editingProcess}
        onSuccess={() => { setFormOpen(false); setEditingProcess(null); load() }}
      />

      <ProcessDetailDialog
        open={!!detailProcess}
        onClose={() => setDetailProcess(null)}
        processId={detailProcess?.id || null}
      />
    </div>
  )
}

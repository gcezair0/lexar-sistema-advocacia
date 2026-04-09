'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, Pagination } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import { formatDate, formatPhone } from '@/lib/utils'
import { ClientFormDialog } from './client-form-dialog'
import { Users } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string
  cpfCnpj: string
  type: 'INDIVIDUAL' | 'COMPANY'
  address: string | null
  createdAt: string
  _count?: { processes: number }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/clients', {
        params: { page, limit: 20, search: search || undefined },
      })
      setClients(data.data || data.clients || data)
      setTotalPages(data.totalPages || 1)
    } catch {
      toast({ type: 'error', title: 'Erro ao carregar clientes' })
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  function handleEdit(client: Client) {
    setEditingClient(client)
    setDialogOpen(true)
  }

  function handleNew() {
    setEditingClient(null)
    setDialogOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    try {
      await api.delete(`/clients/${id}`)
      toast({ type: 'success', title: 'Cliente excluído com sucesso' })
      loadClients()
    } catch {
      toast({ type: 'error', title: 'Erro ao excluir cliente' })
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (c: Client) => (
        <div>
          <p className="font-medium text-gray-900">{c.name}</p>
          <p className="text-xs text-gray-500">{c.cpfCnpj}</p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contato',
      render: (c: Client) => (
        <div>
          <p className="text-sm">{formatPhone(c.phone)}</p>
          {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (c: Client) => (
        <Badge variant={c.type === 'INDIVIDUAL' ? 'default' : 'purple'}>
          {c.type === 'INDIVIDUAL' ? 'Pessoa Física' : 'Pessoa Jurídica'}
        </Badge>
      ),
    },
    {
      key: 'processes',
      header: 'Processos',
      render: (c: Client) => (
        <span className="text-sm text-gray-600">{c._count?.processes ?? 0}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Cadastro',
      render: (c: Client) => <span className="text-sm text-gray-500">{formatDate(c.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (c: Client) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(c.id)}>
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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os clientes do escritório</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, CPF ou telefone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {!loading && clients.length === 0 && !search ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="Nenhum cliente cadastrado"
          description="Adicione seu primeiro cliente para começar."
          action={
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" /> Novo Cliente
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={clients}
            keyExtractor={(c) => c.id}
            loading={loading}
            emptyMessage="Nenhum cliente encontrado"
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Dialog */}
      <ClientFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingClient(null)
        }}
        client={editingClient}
        onSuccess={() => {
          setDialogOpen(false)
          setEditingClient(null)
          loadClients()
        }}
      />
    </div>
  )
}

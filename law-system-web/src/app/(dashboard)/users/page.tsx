'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, Pagination } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { UserFormDialog } from './user-form-dialog'

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  oabNumber: string | null
  active: boolean
  createdAt: string
}

const roleMap: Record<string, { label: string; variant: string }> = {
  ADMIN: { label: 'Administrador', variant: 'destructive' },
  LAWYER: { label: 'Advogado', variant: 'default' },
  INTERN: { label: 'Estagiário', variant: 'secondary' },
  SECRETARY: { label: 'Secretária', variant: 'purple' },
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users', {
        params: { page, limit: 20, search: search || undefined },
      })
      setUsers(data.data || data.users || data)
      setTotalPages(data.totalPages || 1)
    } catch {
      toast({ type: 'error', title: 'Erro ao carregar usuários' })
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  async function handleToggleActive(user: UserItem) {
    try {
      await api.patch(`/users/${user.id}`, { active: !user.active })
      toast({ type: 'success', title: user.active ? 'Usuário desativado' : 'Usuário ativado' })
      load()
    } catch {
      toast({ type: 'error', title: 'Erro ao atualizar' })
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Usuário',
      render: (u: UserItem) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size="sm" />
          <div>
            <p className="font-medium text-gray-900">{u.name}</p>
            <p className="text-xs text-gray-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Cargo',
      render: (u: UserItem) => {
        const r = roleMap[u.role] || { label: u.role, variant: 'secondary' }
        return <Badge variant={r.variant as 'destructive' | 'default' | 'secondary' | 'purple'}>{r.label}</Badge>
      },
    },
    {
      key: 'oab',
      header: 'OAB',
      render: (u: UserItem) => <span className="text-sm text-gray-600">{u.oabNumber || '—'}</span>,
    },
    {
      key: 'active',
      header: 'Status',
      render: (u: UserItem) => (
        <Badge variant={u.active ? 'success' : 'secondary'}>
          {u.active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Desde',
      render: (u: UserItem) => <span className="text-sm text-gray-500">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-36',
      render: (u: UserItem) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setEditingUser(u); setFormOpen(true) }}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={u.active ? 'text-red-600' : 'text-green-600'}
            onClick={() => handleToggleActive(u)}
          >
            {u.active ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">Advogados, estagiários e secretárias</p>
        </div>
        <Button onClick={() => { setEditingUser(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
      </div>

      {!loading && users.length === 0 && !search ? (
        <EmptyState
          icon={<UserCog className="h-12 w-12" />}
          title="Nenhum usuário cadastrado"
          action={<Button onClick={() => { setEditingUser(null); setFormOpen(true) }}><Plus className="h-4 w-4 mr-2" /> Novo Usuário</Button>}
        />
      ) : (
        <>
          <DataTable columns={columns} data={users} keyExtractor={(u) => u.id} loading={loading} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <UserFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingUser(null) }}
        user={editingUser}
        onSuccess={() => { setFormOpen(false); setEditingUser(null); load() }}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Scale,
  Calendar,
  Smartphone,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/spinner'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface DashboardData {
  stats: {
    totalClients: number
    totalProcesses: number
    upcomingEvents: number
    totalLeads: number
    activeProcesses: number
    pendingDocuments: number
  }
  recentProcesses: Array<{
    id: string
    number: string
    title: string
    status: string
    client: { name: string }
    createdAt: string
  }>
  upcomingEvents: Array<{
    id: string
    title: string
    type: string
    dateTime: string
    process?: { number: string }
  }>
  recentLeads: Array<{
    id: string
    name: string
    phone: string
    status: string
    legalArea: string
    createdAt: string
  }>
}

const statusColors: Record<string, string> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  CLOSED: 'secondary',
  ARCHIVED: 'secondary',
  SUSPENDED: 'destructive',
  NEW: 'default',
  CONTACTED: 'warning',
  CONVERTED: 'success',
  LOST: 'destructive',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  PENDING: 'Pendente',
  CLOSED: 'Encerrado',
  ARCHIVED: 'Arquivado',
  SUSPENDED: 'Suspenso',
  NEW: 'Novo',
  CONTACTED: 'Contatado',
  CONVERTED: 'Convertido',
  LOST: 'Perdido',
}

const eventTypeLabels: Record<string, string> = {
  HEARING: 'Audiência',
  MEETING: 'Reunião',
  DEADLINE: 'Prazo',
  TASK: 'Tarefa',
  OTHER: 'Outro',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const { data: result } = await api.get('/dashboard')
      setData(result)
    } catch {
      // If /dashboard endpoint isn't ready, use mock data
      setData({
        stats: {
          totalClients: 0,
          totalProcesses: 0,
          upcomingEvents: 0,
          totalLeads: 0,
          activeProcesses: 0,
          pendingDocuments: 0,
        },
        recentProcesses: [],
        upcomingEvents: [],
        recentLeads: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoader />

  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do escritório</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Clientes"
          value={stats?.totalClients ?? 0}
          icon={<Users className="h-5 w-5" />}
          color="blue"
          href="/clients"
        />
        <StatsCard
          title="Processos Ativos"
          value={stats?.activeProcesses ?? 0}
          icon={<Scale className="h-5 w-5" />}
          color="green"
          href="/processes"
        />
        <StatsCard
          title="Agenda (próx. 7 dias)"
          value={stats?.upcomingEvents ?? 0}
          icon={<Calendar className="h-5 w-5" />}
          color="purple"
          href="/events"
        />
        <StatsCard
          title="Leads (WhatsApp)"
          value={stats?.totalLeads ?? 0}
          icon={<Smartphone className="h-5 w-5" />}
          color="orange"
          href="/whatsapp"
        />
      </div>

      {/* Content Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Processes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Processos Recentes</CardTitle>
            <Link href="/processes" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data?.recentProcesses && data.recentProcesses.length > 0 ? (
              <div className="space-y-3">
                {data.recentProcesses.map((proc) => (
                  <div key={proc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{proc.title}</p>
                      <p className="text-xs text-gray-500">{proc.number} • {proc.client.name}</p>
                    </div>
                    <Badge variant={statusColors[proc.status] as 'success' | 'warning' | 'destructive' | 'secondary' | 'default'}>
                      {statusLabels[proc.status] || proc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">Nenhum processo recente</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Próximos Compromissos</CardTitle>
            <Link href="/events" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data?.upcomingEvents && data.upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingEvents.map((evt) => (
                  <div key={evt.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                      {evt.type === 'HEARING' ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{evt.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(evt.dateTime)} • {eventTypeLabels[evt.type] || evt.type}
                        {evt.process && ` • ${evt.process.number}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">Nenhum compromisso próximo</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Leads Recentes (WhatsApp)</CardTitle>
          <Link href="/whatsapp" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Ver todos <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {data?.recentLeads && data.recentLeads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.recentLeads.map((lead) => (
                <div key={lead.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                    <Badge variant={statusColors[lead.status] as 'success' | 'warning' | 'destructive' | 'secondary' | 'default'}>
                      {statusLabels[lead.status] || lead.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{lead.phone}</p>
                  <p className="text-xs text-gray-500 mt-1">{lead.legalArea} • {formatDate(lead.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">Nenhum lead recente</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
  href: string
}) {
  const bgColors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
            <div className={`p-3 rounded-xl ${bgColors[color]}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

import { prisma } from '../../../shared/infra/prisma/prisma'

export class DashboardService {
  async getStats(officeId: string) {
    const [
      totalClients,
      activeClients,
      clientsByStatus,
      totalProcesses,
      processesByStatus,
      totalLeads,
      convertedLeads,
      recentSessions,
      upcomingEvents,
    ] = await Promise.all([
      prisma.client.count({ where: { officeId } }),
      prisma.client.count({ where: { officeId, status: 'ACTIVE' } }),
      prisma.client.groupBy({
        by: ['status'],
        where: { officeId },
        _count: true,
      }),
      prisma.process.count({ where: { officeId } }),
      prisma.process.groupBy({
        by: ['status'],
        where: { officeId },
        _count: true,
      }),
      prisma.lead.count({ where: { officeId } }),
      prisma.lead.count({ where: { officeId, converted: true } }),
      prisma.chatSession.count({
        where: {
          officeId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      prisma.event.count({
        where: {
          officeId,
          completed: false,
          startDate: { gte: new Date() },
        },
      }),
    ])

    return {
      clients: {
        total: totalClients,
        active: activeClients,
        byStatus: clientsByStatus,
      },
      processes: {
        total: totalProcesses,
        byStatus: processesByStatus,
      },
      leads: {
        total: totalLeads,
        converted: convertedLeads,
        conversionRate: totalLeads > 0
          ? ((convertedLeads / totalLeads) * 100).toFixed(1) + '%'
          : '0%',
      },
      chat: {
        totalSessions: recentSessions,
      },
      events: {
        upcoming: upcomingEvents,
      },
    }
  }

  async getRecentActivity(officeId: string, limit = 10) {
    const [recentAuditLogs, recentMovements] = await Promise.all([
      prisma.auditLog.findMany({
        where: { officeId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.movement.findMany({
        where: { process: { officeId } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { process: { select: { id: true, number: true, title: true } } },
      }),
    ])

    return {
      auditLogs: recentAuditLogs,
      recentMovements,
    }
  }
}

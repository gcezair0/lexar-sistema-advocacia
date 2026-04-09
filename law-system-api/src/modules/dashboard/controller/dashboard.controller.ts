import { FastifyRequest, FastifyReply } from 'fastify'
import { DashboardService } from '../service/dashboard.service'

export class DashboardController {
  private service = new DashboardService()

  getStats = async (req: FastifyRequest, reply: FastifyReply) => {
    const { officeId } = req.currentUser
    const stats = await this.service.getStats(officeId)
    return reply.send(stats)
  }

  getRecentActivity = async (req: FastifyRequest, reply: FastifyReply) => {
    const { officeId } = req.currentUser
    const { limit } = req.query as { limit?: string }
    const activity = await this.service.getRecentActivity(
      officeId,
      limit ? Number(limit) : undefined
    )
    return reply.send(activity)
  }
}

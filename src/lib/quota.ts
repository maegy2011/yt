import { db } from '@/lib/db'

export interface QuotaInfo {
  used: number
  total: number
  remaining: number
  percentage: number
  status: 'normal' | 'warning' | 'critical'
}

export class QuotaManager {
  static async getCurrentQuota(): Promise<QuotaInfo> {
    try {
      // Get current month start
      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)

      // Get quota total from settings
      const quotaSetting = await db.setting.findUnique({
        where: { key: 'api_quota_total' }
      })

      const total = quotaSetting?.value?.value || 10000

      // Get used quota for current month
      const quotaLogs = await db.apiQuotaLog.findMany({
        where: {
          date: {
            gte: currentMonth
          }
        }
      })

      const used = quotaLogs.reduce((sum, log) => sum + log.used_units, 0)
      const remaining = Math.max(0, total - used)
      const percentage = total > 0 ? (used / total) * 100 : 0

      // Determine status
      let status: 'normal' | 'warning' | 'critical' = 'normal'
      if (percentage >= 80) {
        status = 'critical'
      } else if (percentage >= 50) {
        status = 'warning'
      }

      return {
        used,
        total,
        remaining,
        percentage,
        status
      }
    } catch (error) {
      console.error('Error getting quota info:', error)
      return {
        used: 0,
        total: 10000,
        remaining: 10000,
        percentage: 0,
        status: 'normal'
      }
    }
  }

  static async recordUsage(units: number = 1): Promise<void> {
    try {
      await db.apiQuotaLog.create({
        data: {
          date: new Date(),
          used_units: units,
          remaining_units: null
        }
      })
    } catch (error) {
      console.error('Error recording quota usage:', error)
    }
  }

  static async checkQuotaAlerts(): Promise<{
    hasAlerts: boolean
    alerts: string[]
  }> {
    try {
      const quota = await this.getCurrentQuota()
      const alerts: string[] = []

      // Check for quota alerts
      if (quota.percentage >= 90) {
        alerts.push(`Critical: YouTube API quota usage is at ${quota.percentage.toFixed(1)}% (${quota.used}/${quota.total} units)`)
      } else if (quota.percentage >= 80) {
        alerts.push(`Warning: YouTube API quota usage is at ${quota.percentage.toFixed(1)}% (${quota.used}/${quota.total} units)`)
      }

      // Check if quota is nearly exhausted
      if (quota.remaining <= 100) {
        alerts.push(`Critical: Only ${quota.remaining} YouTube API quota units remaining`)
      }

      return {
        hasAlerts: alerts.length > 0,
        alerts
      }
    } catch (error) {
      console.error('Error checking quota alerts:', error)
      return {
        hasAlerts: false,
        alerts: []
      }
    }
  }

  static async getQuotaHistory(months: number = 6): Promise<Array<{
    month: string
    used: number
    total: number
    percentage: number
  }>> {
    try {
      const history = []
      const quotaSetting = await db.setting.findUnique({
        where: { key: 'api_quota_total' }
      })

      const total = quotaSetting?.value?.value || 10000

      for (let i = 0; i < months; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        date.setDate(1)
        date.setHours(0, 0, 0, 0)

        const nextMonth = new Date(date)
        nextMonth.setMonth(nextMonth.getMonth() + 1)

        const quotaLogs = await db.apiQuotaLog.findMany({
          where: {
            date: {
              gte: date,
              lt: nextMonth
            }
          }
        })

        const used = quotaLogs.reduce((sum, log) => sum + log.used_units, 0)
        const percentage = total > 0 ? (used / total) * 100 : 0

        history.push({
          month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          used,
          total,
          percentage
        })
      }

      return history.reverse()
    } catch (error) {
      console.error('Error getting quota history:', error)
      return []
    }
  }

  static async updateQuotaTotal(newTotal: number): Promise<void> {
    try {
      await db.setting.upsert({
        where: { key: 'api_quota_total' },
        update: {
          value: { value: newTotal }
        },
        create: {
          key: 'api_quota_total',
          value: { value: newTotal }
        }
      })
    } catch (error) {
      console.error('Error updating quota total:', error)
      throw error
    }
  }
}
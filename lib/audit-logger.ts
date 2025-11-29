import { db } from '@/lib/db'

interface AuditLogData {
  action: 'add' | 'remove' | 'modify' | 'expire'
  itemType: 'blacklist' | 'whitelist'
  itemId: string
  previousData?: any
  newData?: any
  reason?: string
  userId?: string
  ipAddress?: string
  userAgent?: string
}

export class AuditLogger {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await db.blacklistAuditLog.create({
        data: {
          action: data.action,
          itemType: data.itemType,
          itemId: data.itemId,
          previousData: data.previousData ? JSON.stringify(data.previousData) : null,
          newData: data.newData ? JSON.stringify(data.newData) : null,
          reason: data.reason || null,
          userId: data.userId || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null
        }
      })
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to create audit log:', error)
    }
  }

  static async logAdd(
    itemType: 'blacklist' | 'whitelist',
    item: any,
    context?: { userId?: string; ipAddress?: string; userAgent?: string; reason?: string }
  ): Promise<void> {
    await this.log({
      action: 'add',
      itemType,
      itemId: item.itemId,
      newData: item,
      ...context
    })
  }

  static async logRemove(
    itemType: 'blacklist' | 'whitelist',
    item: any,
    context?: { userId?: string; ipAddress?: string; userAgent?: string; reason?: string }
  ): Promise<void> {
    await this.log({
      action: 'remove',
      itemType,
      itemId: item.itemId,
      previousData: item,
      ...context
    })
  }

  static async logModify(
    itemType: 'blacklist' | 'whitelist',
    itemId: string,
    previousItem: any,
    newItem: any,
    context?: { userId?: string; ipAddress?: string; userAgent?: string; reason?: string }
  ): Promise<void> {
    await this.log({
      action: 'modify',
      itemType,
      itemId,
      previousData: previousItem,
      newData: newItem,
      ...context
    })
  }

  static async logExpire(
    itemType: 'blacklist' | 'whitelist',
    item: any,
    context?: { userId?: string; ipAddress?: string; userAgent?: string; reason?: string }
  ): Promise<void> {
    await this.log({
      action: 'expire',
      itemType,
      itemId: item.itemId,
      previousData: item,
      ...context
    })
  }

  static async getAuditLogs(filters?: {
    itemType?: 'blacklist' | 'whitelist'
    itemId?: string
    action?: string
    userId?: string
    limit?: number
    offset?: number
  }) {
    try {
      const where: any = {}
      
      if (filters?.itemType) where.itemType = filters.itemType
      if (filters?.itemId) where.itemId = filters.itemId
      if (filters?.action) where.action = filters.action
      if (filters?.userId) where.userId = filters.userId

      const logs = await db.blacklistAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 100,
        skip: filters?.offset || 0
      })

      return logs.map(log => ({
        ...log,
        previousData: log.previousData ? JSON.parse(log.previousData) : null,
        newData: log.newData ? JSON.parse(log.newData) : null
      }))
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      return []
    }
  }

  static async getAuditStats(timeRange?: { from: Date; to: Date }) {
    try {
      const where = timeRange ? {
        createdAt: {
          gte: timeRange.from,
          lte: timeRange.to
        }
      } : {}

      const [addAction, removeAction, modifyAction, expireAction] = await Promise.all([
        db.blacklistAuditLog.count({ where: { ...where, action: 'add' } }),
        db.blacklistAuditLog.count({ where: { ...where, action: 'remove' } }),
        db.blacklistAuditLog.count({ where: { ...where, action: 'modify' } }),
        db.blacklistAuditLog.count({ where: { ...where, action: 'expire' } })
      ])

      const [blacklistActions, whitelistActions] = await Promise.all([
        db.blacklistAuditLog.count({ where: { ...where, itemType: 'blacklist' } }),
        db.blacklistAuditLog.count({ where: { ...where, itemType: 'whitelist' } })
      ])

      return {
        byAction: {
          add: addAction,
          remove: removeAction,
          modify: modifyAction,
          expire: expireAction
        },
        byItemType: {
          blacklist: blacklistActions,
          whitelist: whitelistActions
        },
        total: addAction + removeAction + modifyAction + expireAction
      }
    } catch (error) {
      console.error('Failed to fetch audit stats:', error)
      return {
        byAction: { add: 0, remove: 0, modify: 0, expire: 0 },
        byItemType: { blacklist: 0, whitelist: 0 },
        total: 0
      }
    }
  }
}
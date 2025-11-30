import { db } from '@/lib/db'
import { AuditLogger } from './audit-logger'

interface OperationData {
  action: 'add' | 'remove' | 'modify'
  itemType: 'blacklist' | 'whitelist'
  itemId: string
  itemData: any
  userId?: string
}

export class UndoRedoManager {
  static async createOperation(data: OperationData): Promise<string> {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      await db.blacklistOperation.create({
        data: {
          operationId,
          action: data.action,
          itemType: data.itemType,
          itemId: data.itemId,
          itemData: JSON.stringify(data.itemData),
          userId: data.userId || null
        }
      })
      
      return operationId
    } catch (error) {
      console.error('Failed to create operation:', error)
      throw new Error('Failed to create operation record')
    }
  }

  static async undoOperation(operationId: string, userId?: string): Promise<boolean> {
    try {
      const operation = await db.blacklistOperation.findUnique({
        where: { operationId }
      })

      if (!operation) {
        throw new Error('Operation not found')
      }

      if (operation.isUndo) {
        throw new Error('Operation already undone')
      }

      const itemData = JSON.parse(operation.itemData)
      let success = false

      switch (operation.action) {
        case 'add':
          // Undo add = remove the item
          success = await this.removeItem(operation.itemType as 'blacklist' | 'whitelist', operation.itemId)
          break

        case 'remove':
          // Undo remove = re-add the item
          success = await this.addItem(operation.itemType as 'blacklist' | 'whitelist', itemData)
          break

        case 'modify':
          // Undo modify = restore previous state (requires audit log)
          success = await this.restorePreviousState(operation.itemType as 'blacklist' | 'whitelist', operation.itemId)
          break
      }

      if (success) {
        await db.blacklistOperation.update({
          where: { id: operation.id },
          data: {
            isUndo: true,
            appliedAt: new Date()
          }
        })

        // Log the undo action
        await AuditLogger.logModify(
          operation.itemType as 'blacklist' | 'whitelist',
          operation.itemId,
          itemData,
          null,
          {
            userId,
            reason: `Undo operation: ${operationId}`
          }
        )
      }

      return success
    } catch (error) {
      console.error('Failed to undo operation:', error)
      return false
    }
  }

  static async redoOperation(operationId: string, userId?: string): Promise<boolean> {
    try {
      const operation = await db.blacklistOperation.findUnique({
        where: { operationId }
      })

      if (!operation) {
        throw new Error('Operation not found')
      }

      if (!operation.isUndo) {
        throw new Error('Operation has not been undone')
      }

      if (operation.isRedo) {
        throw new Error('Operation already redone')
      }

      const itemData = JSON.parse(operation.itemData)
      let success = false

      switch (operation.action) {
        case 'add':
          // Redo add = add the item again
          success = await this.addItem(operation.itemType as 'blacklist' | 'whitelist', itemData)
          break

        case 'remove':
          // Redo remove = remove the item again
          success = await this.removeItem(operation.itemType as 'blacklist' | 'whitelist', operation.itemId)
          break

        case 'modify':
          // Redo modify = re-apply the modification
          success = await this.applyModification(operation.itemType as 'blacklist' | 'whitelist', operation.itemId, itemData)
          break
      }

      if (success) {
        await db.blacklistOperation.update({
          where: { id: operation.id },
          data: {
            isRedo: true,
            appliedAt: new Date()
          }
        })

        // Log the redo action
        await AuditLogger.logModify(
          operation.itemType as 'blacklist' | 'whitelist',
          operation.itemId,
          null,
          itemData,
          {
            userId,
            reason: `Redo operation: ${operationId}`
          }
        )
      }

      return success
    } catch (error) {
      console.error('Failed to redo operation:', error)
      return false
    }
  }

  static async getOperationHistory(
    userId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const where = userId ? { userId } : {}
      
      const operations = await db.blacklistOperation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return operations.map(op => ({
        ...op,
        itemData: JSON.parse(op.itemData),
        canUndo: !op.isUndo,
        canRedo: op.isUndo && !op.isRedo
      }))
    } catch (error) {
      console.error('Failed to fetch operation history:', error)
      return []
    }
  }

  private static async addItem(itemType: 'blacklist' | 'whitelist', itemData: any): Promise<boolean> {
    try {
      if (itemType === 'blacklist') {
        await db.blacklistedItem.create({
          data: {
            itemId: itemData.itemId,
            title: itemData.title,
            type: itemData.type,
            thumbnail: itemData.thumbnail || null,
            channelName: itemData.channelName || null,
            isChannelBlock: itemData.isChannelBlock || false,
            priority: itemData.priority || 0,
            expiresAt: itemData.expiresAt ? new Date(itemData.expiresAt) : null
          }
        })
      } else {
        await db.whitelistedItem.create({
          data: {
            itemId: itemData.itemId,
            title: itemData.title,
            type: itemData.type,
            thumbnail: itemData.thumbnail || null,
            channelName: itemData.channelName || null,
            isChannelWhitelist: itemData.isChannelWhitelist || false,
            priority: itemData.priority || 0,
            expiresAt: itemData.expiresAt ? new Date(itemData.expiresAt) : null
          }
        })
      }
      return true
    } catch (error) {
      console.error('Failed to add item during undo/redo:', error)
      return false
    }
  }

  private static async removeItem(itemType: 'blacklist' | 'whitelist', itemId: string): Promise<boolean> {
    try {
      if (itemType === 'blacklist') {
        await db.blacklistedItem.delete({
          where: { itemId }
        })
      } else {
        await db.whitelistedItem.delete({
          where: { itemId }
        })
      }
      return true
    } catch (error) {
      console.error('Failed to remove item during undo/redo:', error)
      return false
    }
  }

  private static async restorePreviousState(itemType: 'blacklist' | 'whitelist', itemId: string): Promise<boolean> {
    try {
      // Find the most recent modify operation for this item
      const auditLogs = await db.blacklistAuditLog.findMany({
        where: {
          itemType,
          itemId,
          action: 'modify'
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      })

      if (auditLogs.length === 0 || !auditLogs[0].previousData) {
        return false
      }

      const previousData = JSON.parse(auditLogs[0].previousData)
      
      if (itemType === 'blacklist') {
        await db.blacklistedItem.update({
          where: { itemId },
          data: previousData
        })
      } else {
        await db.whitelistedItem.update({
          where: { itemId },
          data: previousData
        })
      }

      return true
    } catch (error) {
      console.error('Failed to restore previous state:', error)
      return false
    }
  }

  private static async applyModification(itemType: 'blacklist' | 'whitelist', itemId: string, itemData: any): Promise<boolean> {
    try {
      if (itemType === 'blacklist') {
        await db.blacklistedItem.update({
          where: { itemId },
          data: itemData
        })
      } else {
        await db.whitelistedItem.update({
          where: { itemId },
          data: itemData
        })
      }
      return true
    } catch (error) {
      console.error('Failed to apply modification:', error)
      return false
    }
  }

  static async cleanupOldOperations(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      await db.blacklistOperation.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      })
    } catch (error) {
      console.error('Failed to cleanup old operations:', error)
    }
  }
}
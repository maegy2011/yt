import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { QuotaManager } from '@/lib/quota'

export async function GET() {
  try {
    // Check if user is admin
    await requireAdmin()

    const [quota, history, alerts] = await Promise.all([
      QuotaManager.getCurrentQuota(),
      QuotaManager.getQuotaHistory(),
      QuotaManager.checkQuotaAlerts()
    ])

    return NextResponse.json({
      quota,
      history,
      alerts
    })
  } catch (error) {
    console.error('Error fetching quota data:', error)
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch quota data' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    // Check if user is admin
    const admin = await requireAdmin()

    const { total } = await request.json()

    if (!total || typeof total !== 'number' || total <= 0) {
      return NextResponse.json(
        { error: 'Invalid quota total' },
        { status: 400 }
      )
    }

    await QuotaManager.updateQuotaTotal(total)

    return NextResponse.json({
      message: 'Quota total updated successfully',
      total
    })
  } catch (error) {
    console.error('Error updating quota total:', error)
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update quota total' },
      { status: 500 }
    )
  }
}
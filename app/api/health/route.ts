import { NextResponse } from "next/server";

// Debug logging utility for API routes
const debugLog = (route: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [API:${route}] ${action}`, data ? data : '')
}

const debugError = (route: string, action: string, error: any) => {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] [API:${route}] ERROR in ${action}:`, error)
}

export async function GET() {
  debugLog('Health', 'GET request received')
  
  try {
    const response = NextResponse.json({ message: "Good!" })
    debugLog('Health', 'Response sent successfully', { status: 200 })
    return response
  } catch (error) {
    debugError('Health', 'Failed to send response', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
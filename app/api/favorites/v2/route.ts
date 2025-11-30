import { NextRequest } from 'next/server'

// Simple GET handler
export async function GET(request: NextRequest) {
  try {
    // Import the main favorites route handler
    const { GET } = await import('../route')
    return await GET(request)
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}

// Simple POST handler
export async function POST(request: NextRequest) {
  try {
    // Import the main favorites route handler
    const { POST } = await import('../route')
    return await POST(request)
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const message = searchParams.get('message') || 'Hello';
    
    return NextResponse.json({
      success: true,
      message: `Echo: ${message}`,
      timestamp: new Date().toISOString(),
      senderId: 'system'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, senderId } = body;
    
    return NextResponse.json({
      success: true,
      message: `Echo: ${text || 'No message provided'}`,
      timestamp: new Date().toISOString(),
      senderId: senderId || 'unknown'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
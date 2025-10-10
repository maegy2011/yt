import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { 
        error: "YouTube API key not configured",
        message: "Please add NEXT_PUBLIC_YOUTUBE_API_KEY to your environment variables"
      },
      { status: 500 }
    );
  }

  try {
    // Test API with a simple request
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=snippet&id=dQw4w9WgXcQ`
    );
    
    const data = await response.json();
    
    if (response.status === 400) {
      return NextResponse.json(
        {
          error: "YouTube API Error",
          message: data.error?.message || "Bad request",
          details: data.error,
          suggestion: "Please check your API key and ensure YouTube Data API v3 is enabled"
        },
        { status: 400 }
      );
    }
    
    if (response.status === 403) {
      return NextResponse.json(
        {
          error: "YouTube API Quota Exceeded",
          message: data.error?.message || "Quota exceeded",
          details: data.error,
          suggestion: "Please check your API usage or upgrade your quota"
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "YouTube API is working correctly",
      data: data
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        error: "Network Error",
        message: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Please check your internet connection"
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { hadithApi } from '@/lib/hadith-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection') || undefined;
    const grade = searchParams.get('grade') || undefined;

    const hadith = await hadithApi.getRandomHadith({
      collection,
      grade
    });

    return NextResponse.json(hadith);
  } catch (error) {
    console.error('Error in random hadith API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
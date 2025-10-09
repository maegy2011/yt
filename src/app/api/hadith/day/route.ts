import { NextResponse } from 'next/server';
import { hadithApi } from '@/lib/hadith-api';

export async function GET() {
  try {
    const hadith = await hadithApi.getHadithOfTheDay();
    return NextResponse.json(hadith);
  } catch (error) {
    console.error('Error in hadith of the day API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
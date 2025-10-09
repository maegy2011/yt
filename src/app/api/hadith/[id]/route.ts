import { NextRequest, NextResponse } from 'next/server';
import { hadithApi } from '@/lib/hadith-api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const hadith = await hadithApi.getHadithById(id);
    return NextResponse.json(hadith);
  } catch (error) {
    console.error('Error in get hadith by ID API:', error);
    return NextResponse.json(
      { error: 'Hadith not found' },
      { status: 404 }
    );
  }
}
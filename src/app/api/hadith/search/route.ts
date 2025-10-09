import { NextRequest, NextResponse } from 'next/server';
import { hadithApi } from '@/lib/hadith-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('limit') || '10');
    const collection = searchParams.get('collection') || undefined;
    const book = searchParams.get('book') || undefined;
    const grade = searchParams.get('grade') || undefined;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const result = await hadithApi.searchHadith(query, {
      page,
      perPage,
      collection,
      book,
      grade
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in hadith search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
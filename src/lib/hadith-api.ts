// Hadith Encyclopedia API (Dorar.net)
export interface Hadith {
  id: string;
  text: string;
  rawi: string; // الراوي
  mohdith: string; // المحدث
  book: string;
  number: string;
  grade: string; // التخرييج والتصحيح
  explanation?: string;
  translation?: string;
  tags: string[];
}

export interface HadithSearchResult {
  hadiths: Hadith[];
  total: number;
  page: number;
  perPage: number;
}

export interface HadithBook {
  id: string;
  name: string;
  author: string;
  hadithCount: number;
  description?: string;
}

export interface HadithCollection {
  id: string;
  name: string;
  books: HadithBook[];
}

class HadithAPI {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor() {
    this.baseUrl = 'https://dorar.net/api';
  }

  // Set API key if needed
  setApiKey(key: string) {
    this.apiKey = key;
  }

  // Search for hadiths
  async searchHadith(
    query: string,
    options: {
      page?: number;
      perPage?: number;
      collection?: string;
      book?: string;
      grade?: string;
    } = {}
  ): Promise<HadithSearchResult> {
    const { page = 1, perPage = 10, collection, book, grade } = options;
    
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: perPage.toString(),
    });

    if (collection) params.append('collection', collection);
    if (book) params.append('book', book);
    if (grade) params.append('grade', grade);

    try {
      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching hadith:', error);
      throw error;
    }
  }

  // Get hadith by ID
  async getHadithById(id: string): Promise<Hadith> {
    try {
      const response = await fetch(`${this.baseUrl}/hadith/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting hadith by ID:', error);
      throw error;
    }
  }

  // Get random hadith
  async getRandomHadith(options: {
    collection?: string;
    grade?: string;
  } = {}): Promise<Hadith> {
    const { collection, grade } = options;
    
    const params = new URLSearchParams();
    if (collection) params.append('collection', collection);
    if (grade) params.append('grade', grade);

    try {
      const response = await fetch(`${this.baseUrl}/random?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting random hadith:', error);
      throw error;
    }
  }

  // Get hadith of the day
  async getHadithOfTheDay(): Promise<Hadith> {
    try {
      const response = await fetch(`${this.baseUrl}/hadith-of-the-day`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting hadith of the day:', error);
      throw error;
    }
  }

  // Get all collections
  async getCollections(): Promise<HadithCollection[]> {
    try {
      const response = await fetch(`${this.baseUrl}/collections`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting collections:', error);
      throw error;
    }
  }

  // Get books in a collection
  async getBooks(collectionId: string): Promise<HadithBook[]> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${collectionId}/books`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting books:', error);
      throw error;
    }
  }

  // Get hadiths from a specific book
  async getBookHadiths(
    bookId: string,
    options: {
      page?: number;
      perPage?: number;
    } = {}
  ): Promise<HadithSearchResult> {
    const { page = 1, perPage = 10 } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
    });

    try {
      const response = await fetch(`${this.baseUrl}/books/${bookId}/hadiths?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting book hadiths:', error);
      throw error;
    }
  }

  // Search by specific criteria
  async searchByCriteria(options: {
    rawi?: string;
    mohdith?: string;
    grade?: string;
    book?: string;
    page?: number;
    perPage?: number;
  }): Promise<HadithSearchResult> {
    const { 
      rawi, 
      mohdith, 
      grade, 
      book, 
      page = 1, 
      perPage = 10 
    } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
    });

    if (rawi) params.append('rawi', rawi);
    if (mohdith) params.append('mohdith', mohdith);
    if (grade) params.append('grade', grade);
    if (book) params.append('book', book);

    try {
      const response = await fetch(`${this.baseUrl}/search/criteria?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching by criteria:', error);
      throw error;
    }
  }

  // Get hadith explanation
  async getHadithExplanation(hadithId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/hadith/${hadithId}/explanation`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.explanation;
    } catch (error) {
      console.error('Error getting hadith explanation:', error);
      throw error;
    }
  }

  // Get hadith translation
  async getHadithTranslation(hadithId: string, language: 'en' | 'fr' = 'en'): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/hadith/${hadithId}/translation/${language}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.translation;
    } catch (error) {
      console.error('Error getting hadith translation:', error);
      throw error;
    }
  }

  // Get popular hadiths
  async getPopularHadiths(limit: number = 10): Promise<Hadith[]> {
    try {
      const response = await fetch(`${this.baseUrl}/popular?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting popular hadiths:', error);
      throw error;
    }
  }

  // Get hadiths by grade
  async getHadithsByGrade(grade: string, page: number = 1, perPage: number = 10): Promise<HadithSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/grade/${grade}?page=${page}&limit=${perPage}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting hadiths by grade:', error);
      throw error;
    }
  }

  // Get hadiths by narrator (rawi)
  async getHadithsByNarrator(narrator: string, page: number = 1, perPage: number = 10): Promise<HadithSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/narrator/${encodeURIComponent(narrator)}?page=${page}&limit=${perPage}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting hadiths by narrator:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const hadithApi = new HadithAPI();

// Utility functions
export const formatHadithText = (hadith: Hadith): string => {
  return `${hadith.text}\\n\\nالراوي: ${hadith.rawi}\\nالمحدث: ${hadith.mohdith}\\nالكتاب: ${hadith.book}\\nالحكم: ${hadith.grade}`;
};

export const searchHadiths = async (query: string, options?: Parameters<typeof hadithApi.searchHadith>[1]) => {
  return await hadithApi.searchHadith(query, options);
};

export const getHadith = async (id: string) => {
  return await hadithApi.getHadithById(id);
};

export const getRandomHadith = async (options?: Parameters<typeof hadithApi.getRandomHadith>[0]) => {
  return await hadithApi.getRandomHadith(options);
};
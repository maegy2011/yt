"use client";

import { useState, useEffect } from 'react';
import { BookOpen, Search, Heart, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HadithSearch } from '@/components/hadith-search';
import { HadithFavorites } from '@/components/hadith-favorites';
import { type Hadith } from '@/lib/hadith-api';

export default function HadithPage() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularHadiths, setPopularHadiths] = useState<Hadith[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('hadith-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }

    // Load some popular hadiths (mock data for now)
    setPopularHadiths([
      {
        id: '1',
        text: 'إنما الأعمال بالنيات وإنما لكل امرئ ما نوى',
        rawi: 'عمر بن الخطاب',
        mohdith: 'البخاري',
        book: 'صحيح البخاري',
        number: '1',
        grade: 'صحيح',
        tags: ['النية', 'الأخلاق']
      },
      {
        id: '2',
        text: 'الدين النصيحة، قلنا: لمن؟ قال: لله ولكتابه ولرسوله ولأئمة المسلمين وعامتهم',
        rawi: 'تميم الداري',
        mohdith: 'مسلم',
        book: 'صحيح مسلم',
        number: '55',
        grade: 'صحيح',
        tags: ['النصيحة', 'الدين']
      }
    ]);
  }, []);

  const handleSearch = (query: string) => {
    // Add to recent searches
    if (!recentSearches.includes(query)) {
      const updated = [query, ...recentSearches.slice(0, 9)]; // Keep only last 10
      setRecentSearches(updated);
      localStorage.setItem('hadith-recent-searches', JSON.stringify(updated));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">الموسوعة الحديثية</h1>
                <p className="text-sm text-gray-600">بحث متقدم في الأحاديث النبوية الشريفة</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="search" className="flex items-center gap-2 py-3">
              <Search className="w-4 h-4" />
              بحث الأحاديث
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2 py-3">
              <Heart className="w-4 h-4" />
              المفضلة
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center gap-2 py-3">
              <Star className="w-4 h-4" />
              أشهر الأحاديث
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Search className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">100,000+</p>
                      <p className="text-sm text-gray-600">حديث نبوي</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">50+</p>
                      <p className="text-sm text-gray-600">مصنف حديثي</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">24/7</p>
                      <p className="text-sm text-gray-600">متاح دائماً</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    عمليات البحث الأخيرة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          // This would trigger the search
                          const searchInput = document.querySelector('input[placeholder="ابحث عن حديث نبوي..."]') as HTMLInputElement;
                          if (searchInput) {
                            searchInput.value = search;
                            searchInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
                          }
                        }}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Component */}
            <HadithSearch onHadithSelect={(hadith) => handleSearch(hadith.text.substring(0, 30))} />
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <HadithFavorites />
          </TabsContent>

          {/* Popular Hadiths Tab */}
          <TabsContent value="popular" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  أشهر الأحاديث النبوية
                </CardTitle>
                <p className="text-sm text-gray-600">
                  مجموعة من أشهر الأحاديث النبوية التي يحتاجها كل مسلم في حياته اليومية
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularHadiths.map((hadith) => (
                    <Card key={hadith.id} className="hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="text-right text-gray-800 leading-relaxed">
                            <p className="text-lg font-medium">{hadith.text}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 text-sm">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {hadith.book}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {hadith.grade}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            <p>الراوي: {hadith.rawi} | المحدث: {hadith.mohdith}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1">أحاديث الأخلاق</h3>
                  <p className="text-sm text-gray-600">أحاديث تتعلق بالأخلاق الحميدة</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-1">أحاديث العبادات</h3>
                  <p className="text-sm text-gray-600">أحاديث تتعلق بالصلاة والصيام</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-1">أحاديث المعاملات</h3>
                  <p className="text-sm text-gray-600">أحاديث تتعلق بالمعاملات اليومية</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
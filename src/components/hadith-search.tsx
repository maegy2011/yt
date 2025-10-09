"use client";

import { useState, useEffect } from 'react';
import { Search, BookOpen, User, Star, Clock, RefreshCw, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hadithApi, type Hadith, type HadithSearchResult } from '@/lib/hadith-api';
import { useToast } from '@/hooks/use-toast';

interface HadithSearchProps {
  onHadithSelect?: (hadith: Hadith) => void;
}

export function HadithSearch({ onHadithSelect }: HadithSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Hadith[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const [hadithOfTheDay, setHadithOfTheDay] = useState<Hadith | null>(null);
  const [randomHadith, setRandomHadith] = useState<Hadith | null>(null);
  const [searchOptions, setSearchOptions] = useState({
    collection: '',
    book: '',
    grade: '',
    perPage: 10
  });

  const { toast } = useToast();

  // Load hadith of the day on component mount
  useEffect(() => {
    loadHadithOfTheDay();
    loadRandomHadith();
  }, []);

  const loadHadithOfTheDay = async () => {
    try {
      const hadith = await hadithApi.getHadithOfTheDay();
      setHadithOfTheDay(hadith);
    } catch (error) {
      console.error('Error loading hadith of the day:', error);
    }
  };

  const loadRandomHadith = async () => {
    try {
      const hadith = await hadithApi.getRandomHadith();
      setRandomHadith(hadith);
    } catch (error) {
      console.error('Error loading random hadith:', error);
    }
  };

  const handleSearch = async (page: number = 1) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const result: HadithSearchResult = await hadithApi.searchHadith(searchQuery, {
        page,
        perPage: searchOptions.perPage,
        collection: searchOptions.collection || undefined,
        book: searchOptions.book || undefined,
        grade: searchOptions.grade || undefined
      });
      
      setSearchResults(result.hadiths);
      setTotalResults(result.total);
      setCurrentPage(page);
      
      if (result.hadiths.length === 0) {
        toast({
          title: "لا توجد نتائج",
          description: "لم يتم العثور على أحاديث تطابق بحثك",
        });
      }
    } catch (error) {
      console.error('Error searching hadiths:', error);
      toast({
        title: "خطأ",
        description: "فشل البحث عن الأحاديث",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHadithClick = (hadith: Hadith) => {
    setSelectedHadith(hadith);
    if (onHadithSelect) {
      onHadithSelect(hadith);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes('صحيح') || grade.includes('حسن')) return 'bg-green-100 text-green-800';
    if (grade.includes('ضعيف')) return 'bg-red-100 text-red-800';
    if (grade.includes('موضوع')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const addToFavorites = (hadith: Hadith) => {
    const FAVORITES_KEY = 'hadith-favorites';
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);
    let favorites: Hadith[] = [];
    
    if (savedFavorites) {
      try {
        favorites = JSON.parse(savedFavorites);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
    
    const alreadyExists = favorites.some(fav => fav.id === hadith.id);
    if (!alreadyExists) {
      favorites.push(hadith);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      toast({
        title: "تمت الإضافة",
        description: "تمت إضافة الحديث إلى المفضلة",
      });
    } else {
      toast({
        title: "موجود بالفعل",
        description: "الحديث موجود بالفعل في المفضلة",
      });
    }
  };

  const HadithCard = ({ hadith, onClick }: { hadith: Hadith; onClick?: () => void }) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Hadith Text */}
          <div className="text-right text-gray-800 leading-relaxed">
            <p className="text-lg font-medium">{hadith.text}</p>
          </div>
          
          {/* Hadith Metadata */}
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {hadith.rawi}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {hadith.book}
            </Badge>
            <Badge className={`${getGradeColor(hadith.grade)} flex items-center gap-1`}>
              <Star className="w-3 h-3" />
              {hadith.grade}
            </Badge>
          </div>
          
          {/* Additional Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>المحدث: {hadith.mohdith}</p>
            <p>رقم الحديث: {hadith.number}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                addToFavorites(hadith);
              }}
              className="flex-1"
            >
              <Heart className="w-4 h-4 mr-1" />
              للمفضلة
            </Button>
            {onClick && (
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="flex-1"
              >
                التفاصيل
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="w-5 h-5 text-blue-600" />
            بحث في الأحاديث النبوية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="ابحث عن حديث نبوي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-right"
            />
            <Button 
              onClick={() => handleSearch()} 
              disabled={isLoading || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Search Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select value={searchOptions.collection} onValueChange={(value) => setSearchOptions(prev => ({ ...prev, collection: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المصنف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bukhari">صحيح البخاري</SelectItem>
                <SelectItem value="muslim">صحيح مسلم</SelectItem>
                <SelectItem value="abu-dawud">سنن أبي داود</SelectItem>
                <SelectItem value="tirmidhi">سنن الترمذي</SelectItem>
                <SelectItem value="nasai">سنن النسائي</SelectItem>
                <SelectItem value="ibn-majah">سنن ابن ماجه</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={searchOptions.grade} onValueChange={(value) => setSearchOptions(prev => ({ ...prev, grade: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحكم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="صحيح">صحيح</SelectItem>
                <SelectItem value="حسن">حسن</SelectItem>
                <SelectItem value="ضعيف">ضعيف</SelectItem>
                <SelectItem value="موضوع">موضوع</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={searchOptions.perPage.toString()} onValueChange={(value) => setSearchOptions(prev => ({ ...prev, perPage: parseInt(value) }))}>
              <SelectTrigger>
                <SelectValue placeholder="عدد النتائج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="search" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">نتائج البحث</TabsTrigger>
          <TabsTrigger value="day">حديث اليوم</TabsTrigger>
          <TabsTrigger value="random">حديث عشوائي</TabsTrigger>
        </TabsList>

        {/* Search Results Tab */}
        <TabsContent value="search" className="space-y-4">
          {searchResults.length > 0 && (
            <div className="text-sm text-gray-600">
              العثور على {totalResults} حديث ({currentPage} من {Math.ceil(totalResults / searchOptions.perPage)})
            </div>
          )}
          
          <div className="space-y-4">
            {searchResults.map((hadith) => (
              <HadithCard 
                key={hadith.id} 
                hadith={hadith} 
                onClick={() => handleHadithClick(hadith)}
              />
            ))}
            
            {searchResults.length === 0 && !isLoading && searchQuery && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">لم يتم العثور على أحاديث تطابق بحثك</p>
                <p className="text-sm text-gray-400 mt-2">جرب تغيير كلمات البحث أو استخدام مرشحات مختلفة</p>
              </div>
            )}
            
            {isLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                          <div className="h-6 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {searchResults.length > 0 && totalResults > searchOptions.perPage && (
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleSearch(currentPage - 1)}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              <span className="py-2 px-4">
                صفحة {currentPage} من {Math.ceil(totalResults / searchOptions.perPage)}
              </span>
              <Button 
                variant="outline" 
                onClick={() => handleSearch(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalResults / searchOptions.perPage)}
              >
                التالي
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Hadith of the Day Tab */}
        <TabsContent value="day" className="space-y-4">
          {hadithOfTheDay ? (
            <HadithCard 
              hadith={hadithOfTheDay} 
              onClick={() => handleHadithClick(hadithOfTheDay)}
            />
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">جاري تحميل حديث اليوم...</p>
            </div>
          )}
        </TabsContent>

        {/* Random Hadith Tab */}
        <TabsContent value="random" className="space-y-4">
          {randomHadith ? (
            <div className="space-y-4">
              <HadithCard 
                hadith={randomHadith} 
                onClick={() => handleHadithClick(randomHadith)}
              />
              <Button 
                onClick={loadRandomHadith} 
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                حديث عشوائي آخر
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">جاري تحميل حديث عشوائي...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Hadith Detail Dialog */}
      <Dialog open={!!selectedHadith} onOpenChange={() => setSelectedHadith(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">تفاصيل الحديث النبوي</DialogTitle>
          </DialogHeader>
          
          {selectedHadith && (
            <div className="space-y-6">
              {/* Hadith Text */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-right text-lg leading-relaxed text-gray-800">
                    <p className="font-medium mb-4">{selectedHadith.text}</p>
                    {selectedHadith.explanation && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">الشرح:</h4>
                        <p className="text-blue-800">{selectedHadith.explanation}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Hadith Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات الحديث</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">الراوي</label>
                      <p className="text-lg">{selectedHadith.rawi}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">المحدث</label>
                      <p className="text-lg">{selectedHadith.mohdith}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">الكتاب</label>
                      <p className="text-lg">{selectedHadith.book}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">رقم الحديث</label>
                      <p className="text-lg">{selectedHadith.number}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">الحكم</label>
                    <Badge className={`${getGradeColor(selectedHadith.grade)} mt-1`}>
                      {selectedHadith.grade}
                    </Badge>
                  </div>

                  {selectedHadith.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">التصنيفات</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedHadith.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedHadith.text);
                    toast({
                      title: "تم النسخ",
                      description: "تم نسخ نص الحديث إلى الحافظة",
                    });
                  }}
                  variant="outline"
                >
                  نسخ النص
                </Button>
                <Button 
                  onClick={loadRandomHadith}
                  variant="outline"
                >
                  حديث عشوائي
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
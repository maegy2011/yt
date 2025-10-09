"use client";

import { useState, useEffect } from 'react';
import { Heart, Trash2, Copy, Share2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { type Hadith } from '@/lib/hadith-api';
import { useToast } from '@/hooks/use-toast';

interface HadithFavoritesProps {
  onHadithSelect?: (hadith: Hadith) => void;
}

const FAVORITES_KEY = 'hadith-favorites';

export function HadithFavorites({ onHadithSelect }: HadithFavoritesProps) {
  const [favorites, setFavorites] = useState<Hadith[]>([]);
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const { toast } = useToast();

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (hadith: Hadith) => {
    const alreadyExists = favorites.some(fav => fav.id === hadith.id);
    if (!alreadyExists) {
      setFavorites(prev => [...prev, hadith]);
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

  const removeFromFavorites = (hadithId: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== hadithId));
    toast({
      title: "تم الحذف",
      description: "تم حذف الحديث من المفضلة",
    });
  };

  const copyHadithText = (hadith: Hadith) => {
    const text = `${hadith.text}\\n\\nالراوي: ${hadith.rawi}\\nالمحدث: ${hadith.mohdith}\\nالكتاب: ${hadith.book}\\nالحكم: ${hadith.grade}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ الحديث إلى الحافظة",
    });
  };

  const shareHadith = (hadith: Hadith) => {
    if (navigator.share) {
      navigator.share({
        title: 'حديث نبوي',
        text: hadith.text,
        url: window.location.href
      });
    } else {
      copyHadithText(hadith);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes('صحيح') || grade.includes('حسن')) return 'bg-green-100 text-green-800';
    if (grade.includes('ضعيف')) return 'bg-red-100 text-red-800';
    if (grade.includes('موضوع')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const HadithCard = ({ hadith, onRemove }: { hadith: Hadith; onRemove?: () => void }) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Hadith Text */}
          <div className="text-right text-gray-800 leading-relaxed">
            <p className="text-base font-medium line-clamp-3">{hadith.text}</p>
          </div>
          
          {/* Hadith Metadata */}
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {hadith.book}
            </Badge>
            <Badge className={`${getGradeColor(hadith.grade)} flex items-center gap-1`}>
              <Heart className="w-3 h-3" />
              {hadith.grade}
            </Badge>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => copyHadithText(hadith)}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-1" />
              نسخ
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => shareHadith(hadith)}
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-1" />
              مشاركة
            </Button>
            {onRemove && (
              <Button 
                size="sm" 
                variant="destructive"
                onClick={onRemove}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">لا توجد أحاديث مفضلة</p>
        <p className="text-sm text-gray-400 mt-2">
          أضف الأحاديث التي تعجبك إلى المفضلة للوصول السريع إليها
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Heart className="w-5 h-5 text-red-600" />
            الأحاديث المفضلة ({favorites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {favorites.map((hadith) => (
              <HadithCard 
                key={hadith.id} 
                hadith={hadith}
                onRemove={() => removeFromFavorites(hadith.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

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
                  onClick={() => copyHadithText(selectedHadith)}
                  variant="outline"
                >
                  نسخ النص
                </Button>
                <Button 
                  onClick={() => removeFromFavorites(selectedHadith.id)}
                  variant="destructive"
                >
                  حذف من المفضلة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Filter,
  X,
  ChevronDown,
  Check,
  PlayCircle,
  Music,
  Gamepad2,
  BookOpen,
  Lightbulb,
  Newspaper,
  Trophy,
  Coffee,
  Briefcase,
  Smartphone,
  Heart,
  Shield
} from 'lucide-react'

// Content categories with YouTube-specific categories
export interface ContentCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  color: string
  keywords: string[]
  parentId?: string
  subcategories?: ContentCategory[]
}

export const CONTENT_CATEGORIES: ContentCategory[] = [
  // Entertainment
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Entertainment content including comedy, gaming, music, and movies',
    icon: PlayCircle,
    color: 'text-purple-600',
    keywords: ['comedy', 'gaming', 'music', 'movies', 'entertainment', 'fun', 'viral'],
    subcategories: [
      {
        id: 'comedy',
        name: 'Comedy',
        description: 'Funny videos, stand-up comedy, and comedy sketches',
        icon: PlayCircle,
        color: 'text-pink-600',
        keywords: ['comedy', 'funny', 'stand-up', 'humor', 'sketches', 'viral']
      },
      {
        id: 'gaming',
        name: 'Gaming',
        description: 'Video games, gaming content, and esports',
        icon: Gamepad2,
        color: 'text-indigo-600',
        keywords: ['gaming', 'video games', 'esports', 'gameplay', 'gaming content', 'game dev']
      },
      {
        id: 'music',
        name: 'Music',
        description: 'Music videos, concerts, and audio content',
        icon: Music,
        color: 'text-green-600',
        keywords: ['music', 'concert', 'audio', 'song', 'album', 'playlist', 'dj', 'music video']
      }
    ]
  },
  // Education
  {
    id: 'education',
    name: 'Education',
    description: 'Educational content, tutorials, and learning materials',
    icon: BookOpen,
    color: 'text-blue-600',
    keywords: ['education', 'tutorial', 'learning', 'course', 'lesson', 'study', 'academic', 'university', 'college', 'school'],
    subcategories: [
      {
        id: 'science',
        name: 'Science & Technology',
        description: 'Science experiments, tech reviews, and educational content',
        icon: Lightbulb,
        color: 'text-cyan-600',
        keywords: ['science', 'technology', 'tech review', 'experiment', 'how to', 'tech', 'programming', 'coding', 'software']
      }
    ]
  },
  // News
  {
    id: 'news',
    name: 'News & Politics',
    description: 'News coverage, political content, and current events',
    icon: Newspaper,
    color: 'text-orange-600',
    keywords: ['news', 'politics', 'current events', 'breaking news', 'journalism', 'politics']
  },
  // Sports
  {
    id: 'sports',
    name: 'Sports',
    description: 'Sports content, athletic events, and fitness',
    icon: Trophy,
    color: 'text-green-600',
    keywords: ['sports', 'athletic', 'fitness', 'workout', 'exercise', 'competition', 'match']
  },
  // Lifestyle
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Lifestyle content, vlogs, and daily life content',
    icon: Coffee,
    color: 'text-amber-600',
    keywords: ['lifestyle', 'vlog', 'daily life', 'cooking', 'recipe', 'home improvement']
  },
  // Business
  {
    id: 'business',
    name: 'Business & Finance',
    description: 'Business content, financial advice, and entrepreneurship',
    icon: Briefcase,
    color: 'text-blue-600',
    keywords: ['business', 'finance', 'entrepreneurship', 'investment', 'marketing', 'startup']
  },
  // Technology
  {
    id: 'technology',
    name: 'Technology',
    description: 'Technology reviews, software development, and tech content',
    icon: Smartphone,
    color: 'text-blue-600',
    keywords: ['technology', 'software', 'programming', 'coding', 'tech review', 'gadgets', 'app reviews']
  },
  // Health
  {
    id: 'health',
    name: 'Health & Wellness',
    description: 'Health tips, wellness content, and medical information',
    icon: Heart,
    color: 'text-red-600',
    keywords: ['health', 'wellness', 'medical', 'fitness', 'nutrition', 'mental health']
  },
  // Other
  {
    id: 'other',
    name: 'Other',
    description: 'Other content categories',
    icon: Shield,
    color: 'text-gray-600',
    keywords: ['other', 'miscellaneous', 'general', 'random']
  }
]

export interface CategoryFilterProps {
  selectedCategories: string[]
  onCategoriesChange: (categories: string[]) => void
  className?: string
}

export function CategoryFilter({ selectedCategories, onCategoriesChange, className = '' }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = useCallback((categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId]
    
    onCategoriesChange(newCategories)
  }, [selectedCategories, onCategoriesChange])

  const toggleExpanded = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  const clearAll = useCallback(() => {
    onCategoriesChange([])
  }, [onCategoriesChange])

  const selectAll = useCallback(() => {
    const allCategoryIds = CONTENT_CATEGORIES.map(cat => cat.id)
    onCategoriesChange(allCategoryIds)
  }, [onCategoriesChange])

  const getSelectedCount = useCallback(() => {
    return selectedCategories.length
  }, [selectedCategories])

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Categories</span>
          {getSelectedCount() > 0 && (
            <Badge variant="secondary" className="text-xs">
              {getSelectedCount()} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {getSelectedCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1"
          >
            <span>Select Categories</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="border rounded-lg p-4 space-y-3 bg-background">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Content Categories</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="text-xs"
            >
              Select All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CONTENT_CATEGORIES.map((category) => {
              const Icon = category.icon
              const isSelected = selectedCategories.includes(category.id)
              const isExpanded = expandedCategories.has(category.id)
              const hasSubcategories = category.subcategories && category.subcategories.length > 0

              return (
                <div key={category.id} className="space-y-2">
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full justify-start ${category.color} ${isSelected ? 'bg-opacity-20' : ''}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="flex-1 text-left">{category.name}</span>
                    {isSelected && <Check className="h-3 w-3" />}
                    {hasSubcategories && (
                      <ChevronDown 
                        className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpanded(category.id)
                        }}
                      />
                    )}
                  </Button>

                  {hasSubcategories && isExpanded && (
                    <div className="ml-4 space-y-1">
                      {category.subcategories!.map((subcategory) => {
                        const SubIcon = subcategory.icon
                        const isSubSelected = selectedCategories.includes(subcategory.id)

                        return (
                          <Button
                            key={subcategory.id}
                            variant={isSubSelected ? "default" : "ghost"}
                            size="sm"
                            onClick={() => toggleCategory(subcategory.id)}
                            className={`w-full justify-start text-xs ${subcategory.color} ${isSubSelected ? 'bg-opacity-20' : ''}`}
                          >
                            <SubIcon className="h-3 w-3 mr-1" />
                            <span className="flex-1 text-left">{subcategory.name}</span>
                            {isSubSelected && <Check className="h-3 w-3" />}
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
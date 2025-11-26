'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Film,
  Music,
  GameIcon,
  PlayCircle,
  Mic,
  BookOpen,
  Lightbulb,
  Sparkles,
  Heart,
  TrendingUp,
  Globe,
  Clock,
  Users,
  Hash,
  Tag,
  Filter,
  X,
  ChevronDown,
  Check,
  Plus
  Grid3x3
  List
  Video
  Play
  Settings,
  Folders
  Archive,
  Camera,
  Smartphone,
  Tv,
  Radio,
  Newspaper,
  GraduationCap,
  Palette,
  Package,
  ShoppingCart,
  Car,
  Home,
  Briefcase,
  Headphones,
  Gamepad2,
  Dumbbell,
  Bell,
  Search,
  MoreHorizontal,
  SlidersHorizontal,
  Zap,
  Star,
  Award,
  Trophy,
  Target,
  Compass,
  MapPin,
  Building,
  Factory,
  Coffee,
  Utensils,
  Wrench,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff
  Volume2,
  Wifi,
  Battery,
  Bluetooth,
  Download,
  Upload,
  Share,
  Link,
  Bookmark,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  DollarSign,
  User,
  Users2,
  UserPlus,
  UserMinus,
  Settings2,
  LogOut,
  HelpCircle,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Menu,
  Grid3x3,
  ListOrdered,
  Copy,
  Trash2,
  Edit3,
  Save,
  FolderOpen,
  Folder,
  FolderPlus,
  FolderMinus,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FilePlus,
  FileMinus,
  MoreVertical,
  MoreHorizontal,
  SlidersHorizontal,
  Zap,
  Star,
  Award,
  Trophy,
  Target,
  Compass,
  MapPin,
  Building,
  Factory,
  Coffee,
  Utensils,
  Wrench,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Volume2,
  Wifi,
  Battery,
  Bluetooth,
  Download,
  Upload,
  Share,
  Link,
  Bookmark,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  DollarSign,
  User,
  Users2,
  UserPlus,
  UserMinus,
  Settings2,
  LogOut,
  HelpCircle,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Menu,
  Grid3x3,
  ListOrdered,
  Copy,
  Trash2,
  Edit3,
  Save,
  FolderOpen,
  Folder,
  FolderPlus,
  FolderMinus,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FilePlus,
  FileMinus,
  MoreVertical,
  MoreHorizontal,
  SlidersHorizontal,
  Zap,
  Star,
  Award,
  Trophy,
  Target,
  Compass,
  MapPin,
  Building,
  Factory,
  Coffee,
  Utensils,
  Wrench
} from 'lucide-react'

// Content categories with YouTube-specific categories
export interface ContentCategory {
  id: string
  name: string
  description: string
  icon: any
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
        icon: Sparkles,
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
      },
      {
        id: 'movies',
        name: 'Movies & TV',
        description: 'Movies, TV shows, and film content',
        icon: Film,
        color: 'text-red-600',
        keywords: ['movie', 'film', 'tv show', 'series', 'cinema', 'documentary']
      }
    ]
  },
  // Education
  {
    id: 'education',
    name: 'Education',
    description: 'Educational content, tutorials, and learning materials',
    icon: GraduationCap,
    color: 'text-blue-600',
    keywords: ['education', 'tutorial', 'learning', 'course', 'lesson', 'study', 'academic', 'university', 'college', 'school']
    },
    subcategories: [
      {
        id: 'science',
        name: 'Science & Technology',
        description: 'Science experiments, tech reviews, and educational content',
        icon: Lightbulb,
        color: 'text-cyan-600',
        keywords: ['science', 'technology', 'tech review', 'experiment', 'how to', 'tech', 'programming', 'coding', 'software']
      },
      {
        id: 'history',
        name: 'History & Documentaries',
        description: 'Historical content, documentaries, and educational archives',
        icon: Archive,
        color: 'text-amber-600',
        keywords: ['history', 'documentary', 'archive', 'historical', 'education', 'research', 'facts']
      },
      {
        id: 'language',
        name: 'Language Learning',
        description: 'Language courses, language learning, and translation content',
        icon: BookOpen,
        color: 'text-teal-600',
        keywords: ['language', 'learn language', 'translation', 'course', 'foreign language', 'language learning']
      }
    ]
  },
  // News & Politics
  {
    id: 'news',
    name: 'News & Politics',
    description: 'News coverage, political content, and current events',
    icon: Newspaper,
    color: 'text-orange-600',
    keywords: ['news', 'politics', 'current events', 'breaking news', 'journalism', 'politics']
    },
    subcategories: [
      {
        id: 'world-news',
        name: 'World News',
        description: 'International news and global current events',
        icon: Globe,
        color: 'text-red-600',
        keywords: ['world news', 'international', 'global', 'current events']
      },
      {
        id: 'technology-news',
        name: 'Technology News',
        description: 'Tech news, gadget reviews, and innovation',
        icon: Smartphone,
        color: 'text-blue-600',
        keywords: ['tech news', 'gadgets', 'innovation', 'technology', 'reviews']
      },
      {
        id: 'politics',
        name: 'Politics',
        description: 'Political commentary, government content, and civic issues',
        icon: Users2,
        color: 'text-slate-600',
        keywords: ['politics', 'government', 'civic', 'political', 'debate']
      }
    ]
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
    subcategories: [
      {
        id: 'football',
        name: 'Football',
        description: 'Football matches, highlights, and soccer content',
        icon: Users,
        color: 'text-blue-600',
        keywords: ['football', 'soccer', 'match', 'highlight', 'goal', 'team']
      },
      {
        id: 'basketball',
        name: 'Basketball',
        description: 'Basketball games, highlights, and basketball content',
        icon: Users,
        color: 'text-orange-600',
        keywords: ['basketball', 'nba', 'highlights', 'dunk', 'slam dunk']
      },
      {
        id: 'baseball',
        name: 'Baseball',
        description: 'Baseball games, highlights, and baseball content',
        icon: Users,
        color: 'text-red-600',
        keywords: ['baseball', 'mlb', 'home run', 'strikeout', 'world series']
      },
      {
        id: 'tennis',
        name: 'Tennis',
        description: 'Tennis matches, tutorials, and tennis content',
        icon: Users,
        color: 'text-green-600',
        keywords: ['tennis', 'match', 'grand slam', 'wimbledon', 'tutorial']
      },
      {
        id: 'fitness',
        name: 'Fitness & Health',
        description: 'Workout routines, fitness tutorials, and health content',
        icon: Heart,
        color: 'text-pink-600',
        keywords: ['fitness', 'workout', 'exercise', 'health', 'gym', 'training']
      }
    ]
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
    subcategories: [
      {
        id: 'food',
        name: 'Food & Cooking',
        description: 'Cooking tutorials, recipes, and food content',
        icon: Utensils,
        color: 'text-orange-600',
        keywords: ['cooking', 'recipe', 'food', 'baking', 'kitchen', 'chef']
      },
      {
        id: 'travel',
        name: 'Travel',
        description: 'Travel vlogs, destination guides, and travel content',
        icon: MapPin,
        color: 'text-blue-600',
        keywords: ['travel', 'vacation', 'destination', 'guide', 'tourism']
      },
      {
        id: 'fashion',
        name: 'Fashion & Beauty',
        description: 'Fashion content, beauty tutorials, and style guides',
        icon: Sparkles,
        color: 'text-pink-600',
        keywords: ['fashion', 'beauty', 'makeup', 'style', 'tutorial']
      },
      {
        id: 'home-garden',
        name: 'Home & Garden',
        description: 'Home improvement, gardening, and DIY content',
        icon: Home,
        color: 'text-green-600',
        keywords: ['home improvement', 'diy', 'gardening', 'home decor']
      }
    ]
  },
  // Business & Finance
  {
    id: 'business',
    name: 'Business & Finance',
    description: 'Business content, financial advice, and entrepreneurship',
    icon: Briefcase,
    color: 'text-blue-600',
    keywords: ['business', 'finance', 'entrepreneurship', 'investment', 'marketing', 'startup']
    },
    subcategories: [
      {
        id: 'investing',
        name: 'Investing & Finance',
        description: 'Investment advice, financial education, and stock market content',
        icon: TrendingUp,
        color: 'text-green-600',
        keywords: ['investing', 'finance', 'stock market', 'trading', 'crypto', 'personal finance']
      },
      {
        id: 'marketing',
        name: 'Marketing',
        description: 'Marketing strategies, digital marketing, and content creation',
        icon: Target,
        color: 'text-purple-600',
        keywords: ['marketing', 'digital marketing', 'content creation', 'seo', 'social media']
      },
      {
        id: 'entrepreneurship',
        name: 'Entrepreneurship',
        description: 'Startup advice, business tips, and entrepreneurial content',
        icon: Lightbulb,
        color: 'text-yellow-600',
        keywords: ['startup', 'entrepreneurship', 'business tips', 'small business']
      }
    ]
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
    subcategories: [
      {
        id: 'software-development',
        name: 'Software Development',
        description: 'Programming tutorials, coding content, and software development',
        icon: Code,
        color: 'text-green-600',
        keywords: ['programming', 'coding', 'software development', 'tutorial', 'code review']
      },
      {
        id: 'artificial-intelligence',
        name: 'Artificial Intelligence',
        description: 'AI content, machine learning, and artificial intelligence',
        icon: Zap,
        color: 'text-purple-600',
        keywords: ['artificial intelligence', 'machine learning', 'ai', 'deep learning', 'neural networks']
      },
      {
        'id': 'web-development',
        name: 'Web Development',
        description: 'Web design, development tutorials, and coding content',
        icon: Globe,
        color: 'text-cyan-600',
        keywords: ['web development', 'web design', 'html', 'css', 'javascript', 'frontend']
      },
      {
        id: 'cybersecurity',
        name: 'Cybersecurity',
        description: 'Cybersecurity content, security tips, and digital privacy',
        icon: Shield,
        color: 'text-red-600',
        keywords: ['cybersecurity', 'security', 'privacy', 'hacking', 'digital security']
      }
    ]
  },
  // Health & Wellness
  {
    id: 'health',
    name: 'Health & Wellness',
    description: 'Health tips, wellness content, and medical information',
    icon: Heart,
    color: 'text-red-600',
    keywords: ['health', 'wellness', 'medical', 'fitness', 'nutrition', 'mental health']
    },
    subcategories: [
      {
        id: 'mental-health',
        name: 'Mental Health',
        description: 'Mental health, meditation, and wellness content',
        icon: Brain,
        color: 'text-purple-600',
        keywords: ['mental health', 'meditation', 'mindfulness', 'stress relief']
      },
      {
        id: 'nutrition',
        name: 'Nutrition',
        description: 'Nutrition advice, healthy recipes, and dietary content',
        icon: Utensils,
        color: 'text-green-600',
        keywords: ['nutrition', 'healthy recipes', 'diet', 'cooking', 'food']
      },
      {
        id: 'medical',
        name: 'Medical Information',
        'description: 'Medical explanations, health education, and medical content',
        icon: Stethoscope,
        color: 'text-blue-600',
        keywords: ['medical', 'health education', 'doctor', 'medicine', 'healthcare']
      }
    ]
  },
  // Arts & Crafts
  {
    id: 'arts',
    name: 'Arts & Crafts',
    description: 'Art tutorials, DIY projects, and creative content',
    icon: Palette,
    color: 'text-pink-600',
    keywords: ['art', 'crafts', 'diy', 'creative', 'drawing', 'painting', 'sculpture']
    },
    subcategories: [
      {
        id: 'music-creation',
        name: 'Music Creation',
        description: 'Music production, beat making, and audio creation',
        icon: Music,
        color: 'text-purple-600',
        keywords: ['music production', 'beat making', 'audio editing', 'djs', 'mixing']
      },
      {
        id: 'photography',
        name: 'Photography',
        description: 'Photography tutorials, photo editing, and camera reviews',
        icon: Camera,
        color: 'text-blue-600',
        keywords: ['photography', 'camera', 'photo editing', 'photo tutorials']
      },
      {
        id: 'writing',
        name: 'Writing',
        description: 'Writing tips, creative writing, and content creation',
        icon: Edit3,
        color: 'text-green-600',
        keywords: ['writing', 'creative writing', 'content creation', 'storytelling']
      },
      {
        id: 'drawing',
        name: 'Drawing & Painting',
        description: 'Drawing tutorials, art techniques, and painting guides',
        icon: Palette,
        color: 'text-orange-600',
        keywords: ['drawing', 'painting', 'art tutorials', 'sketching']
      }
    ]
  },
  // Autos & Vehicles
  {
    id: 'autos',
    name: 'Autos & Vehicles',
    description: 'Car reviews, automotive content, and vehicle maintenance',
    icon: Car,
    color: 'text-blue-600',
    keywords: ['cars', 'automotive', 'car reviews', 'vehicle maintenance', 'motorcycle', 'truck']
    },
    subcategories: [
      {
        id: 'car-reviews',
        name: 'Car Reviews',
        description: 'Car reviews, automotive journalism, and vehicle testing',
        icon: Car,
        color: 'text-red-600',
        keywords: ['car reviews', 'automotive journalism', 'vehicle testing', 'car comparison']
      },
      {
        id: 'motorcycle',
        name: 'Motorcycles',
        description: 'Motorcycle content, riding tips, and motorcycle reviews',
        icon: Users2,
        color: 'text-orange-600',
        keywords: ['motorcycle', 'riding tips', 'motorcycle reviews', 'bike reviews']
      },
      {
        id: 'trucks',
        name: 'Trucks',
        description: 'Truck content, heavy vehicles, and commercial vehicles',
        icon: Truck,
        color: 'text-gray-600',
        keywords: ['trucks', 'heavy vehicles', 'commercial vehicles', 'truck reviews']
      }
    ]
  },
  // Pets & Animals
  {
    id: 'pets',
    name: 'Pets & Animals',
    description: 'Pet content, animal care, and wildlife videos',
    icon: Heart,
    color: 'text-pink-600',
    keywords: ['pets', 'animals', 'pet care', 'wildlife', 'animal videos', 'dog', 'cat']
    },
    subcategories: [
      {
        id: 'dogs',
        name: 'Dogs',
        description: 'Dog content, dog training, and canine care',
        icon: Users,
        color: 'text-amber-600',
        keywords: ['dogs', 'dog training', 'canine care', 'puppy', 'dog videos']
      },
      {
        id: 'cats',
        name: 'Cats',
        description: 'Cat content, cat care, and feline videos',
        icon: Users2,
        color: 'text-orange-600',
        keywords: ['cats', 'cat care', 'feline', 'kitten', 'cat videos']
      },
      {
        id: 'wildlife',
        name: 'Wildlife',
        nature: 'Wildlife content, animal documentaries, and nature videos',
        icon: Camera,
        color: 'text-green-600',
        keywords: ['wildlife', 'nature', 'animal documentaries', 'wildlife videos']
      }
    ]
  },
  // Science & Exploration
  {
    id: 'science',
    name: 'Science & Exploration',
    description: 'Scientific content, space exploration, and discovery',
    icon: Microscope,
    color: 'text-blue-600',
    keywords: ['science', 'space', 'exploration', 'discovery', 'astronomy', 'physics', 'chemistry']
    },
    subcategories: [
      {
        id: 'astronomy',
        name: 'Astronomy & Space',
        description: 'Space content, astronomy, and stargazing',
        icon: Star,
        color: 'text-purple-600',
        keywords: ['astronomy', 'space', 'stargazing', 'planets', 'telescope', 'nasa']
      },
      {
        id: 'physics',
        name: 'Physics',
        description: 'Physics explanations, experiments, and physics education',
        icon: Atom,
        color: 'text-blue-600',
        keywords: ['physics', 'experiments', 'quantum physics', 'mechanics', 'particle physics']
      },
      {
        id: 'chemistry',
        name: 'Chemistry',
        description: 'Chemistry experiments, chemical education, and lab content',
        icon: Flask,
        color: 'text-green-600',
        keywords: ['chemistry', 'experiments', 'lab', 'chemical education', 'science experiments']
      },
      {
        id: 'biology',
        name: 'Biology',
        description: 'Biology content, biological education, and life sciences',
        icon: Dna,
        color: 'text-green-600',
        keywords: ['biology', 'life sciences', 'genetics', 'evolution', 'microbiology']
      },
      {
        id: 'earth-science',
        name: 'Earth Science',
        description: 'Earth science, geology, and environmental content',
        icon: Globe,
        color: 'text-blue-600',
        keywords: ['earth science', 'geology', 'environment', 'climate', 'ecology']
      }
    ]
  },
  // Gaming
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Video games, game reviews, and gaming culture',
    icon: Gamepad2,
    color: 'text-purple-600',
    keywords: ['gaming', 'video games', 'game reviews', 'gaming culture', 'esports', 'gameplay']
    },
    subcategories: [
      {
        id: 'game-reviews',
        name: 'Game Reviews',
        description: 'Game reviews, gaming news, and game analysis',
        icon: Star,
        color: 'text-yellow-600',
        keywords: ['game reviews', 'gaming news', 'game analysis', 'gameplay']
      },
      {
        'id': 'game-development',
        name: 'Game Development',
        description: 'Game development, game design, and game creation',
        icon: Code,
        color: 'text-green-600',
        keywords: ['game development', 'game design', 'indie games', 'game creation']
      },
      {
        'id': 'esports',
        name: 'Esports',
        description: 'Esports tournaments, competitive gaming, and esports news',
        icon: Trophy,
        color: 'text-orange-600',
        keywords: ['esports', 'tournaments', 'competitive gaming', 'esports news', 'pro gaming']
      },
      {
        'id': 'tabletop-games',
        name: 'Tabletop Games',
        description: 'Tabletop games, board games, and tabletop gaming',
        icon: Grid3x3,
        color: 'text-amber-600',
        keywords: ['tabletop games', 'board games', 'tabletop gaming', 'board games']
      },
      {
        'id': 'mobile-gaming',
        name: 'Mobile Gaming',
        description: 'Mobile games, app reviews, and mobile gaming culture',
        icon: Smartphone,
        color: 'text-blue-600',
        keywords: ['mobile games', 'app reviews', 'mobile gaming', 'android games', 'ios games']
      }
    ]
  },
    // Other
    {
    id: 'other',
    name: 'Other',
    description: 'Uncategorized content and miscellaneous topics',
    icon: MoreHorizontal,
    color: 'text-gray-600',
    keywords: ['miscellaneous', 'uncategorized', 'other topics', 'random content']
    }
  }
}

// Helper function to get category by ID
export function getCategoryById(id: string): ContentCategory | undefined {
  return CONTENT_CATEGORIES.find(cat => cat.id === id)
}

// Helper function to get all categories
export function getAllCategories(): ContentCategory[] {
  return CONTENT_CATEGORIES
}

// Helper function to get popular categories
export function getPopularCategories(): ContentCategory[] {
  return CONTENT_CATEGORIES.slice(0, 8)
}

// Helper function to get categories by type
export function getCategoriesByType(type: string): ContentCategory[] {
  return CONTENT_CATEGORIES.filter(cat => cat.id === type)
}

// Helper function to search categories by name or keywords
export function searchCategories(query: string): ContentCategory[] {
  const searchQuery = query.toLowerCase().trim()
  
  return CONTENT_CATEGORIES.filter(category => 
    category.name.toLowerCase().includes(searchQuery) ||
    category.description.toLowerCase().includes(searchQuery) ||
    category.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery))
  )
}

// Helper function to get category suggestions based on query
export function getCategorySuggestions(query: string, limit: number = 5): ContentCategory[] {
  const searchQuery = query.toLowerCase().trim()
  
  const matches = CONTENT_CATEGORIES.filter(category => 
    category.name.toLowerCase().includes(searchQuery) ||
    category.description.toLowerCase().includes(searchQuery) ||
    category.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery))
  )
  
  // Sort by relevance (exact name matches first, then description, then keywords)
  return matches.sort((a, b) => {
    const aScore = a.name.toLowerCase() === searchQuery ? 100 : 
                   a.description.toLowerCase().includes(searchQuery) ? 80 : 
                   a.keywords.some(k => k.toLowerCase().includes(searchQuery)) ? 60 : 0
    
    const bScore = b.name.toLowerCase() === searchQuery ? 100 : 
                   b.description.toLowerCase().includes(searchQuery) ? 80 : 
                   b.keywords.some(k => k.toLowerCase().includes(searchQuery)) ? 60 : 0
    
    return bScore - aScore
  }).slice(0, limit)
}
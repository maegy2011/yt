# YouTube Clone - Project Structure & Documentation

## 📁 Project Overview

A modern, mobile-first YouTube clone built with Next.js 15, TypeScript, and Tailwind CSS. Features a complete dark/light/system theme system and optimized performance.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with theme provider
│   └── page.tsx           # Main page with lazy loading
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── BottomNav.tsx     # Mobile navigation
│   ├── SideMenu.tsx      # Side navigation menu
│   ├── ThemeProvider.tsx # Theme context provider
│   ├── ThemeToggle.tsx   # Theme switcher component
│   ├── UserProfileMenu.tsx # User profile menu
│   └── VideoCard.tsx     # Video card component
├── constants/            # Application constants
│   └── videos.ts         # Mock video data & categories
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── styles/              # Custom CSS utilities
└── types/               # TypeScript type definitions
    └── index.ts         # Core interfaces
```

## 🎯 Key Features

### 🌓 Theme System
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Full dark theme with proper contrast
- **System Mode**: Follows OS preference
- **Smooth Transitions**: Animated theme switching

### 📱 Mobile-First Design
- **Responsive Layout**: Optimized for mobile devices
- **Touch-Friendly**: 44px minimum touch targets
- **Gesture Support**: Swipe interactions
- **Performance**: Optimized for mobile networks

### ⚡ Performance Optimizations
- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Reduced bundle size
- **Suspense Boundaries**: Smooth loading states
- **Image Optimization**: WebP support with fallbacks

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15**: App Router with React 18
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling

### UI Components
- **shadcn/ui**: Modern component library
- **Lucide React**: Consistent icon system
- **next-themes**: Theme management

### Development Tools
- **ESLint**: Code quality enforcement
- **PostCSS**: CSS processing
- **TypeScript**: Static type checking

## 🎨 Component Architecture

### Main Components

#### `VideoCard`
- Displays video thumbnail, title, channel info
- Supports both index-based and prop-based data
- Optimized with lazy loading

#### `SideMenu`
- Full-featured navigation drawer
- Organized sections (Main, You, Explore, etc.)
- Dark mode support throughout

#### `UserProfileMenu`
- Comprehensive user settings menu
- Integrated theme switcher
- Multiple configuration sections

#### `ThemeToggle`
- Dropdown-style theme selector
- Light/Dark/System options
- Smooth icon transitions

## 📊 Data Management

### Mock Data Structure
```typescript
interface Video {
  id: number
  title: string
  channel: string
  views: string
  timestamp: string
  thumbnail: string
  channelAvatar: string
  duration: string
}
```

### Constants
- **Videos**: Pre-defined video mock data
- **Categories**: Standard YouTube categories
- **Centralized**: Easy to modify and extend

## 🎯 Performance Features

### Lazy Loading
- Components loaded only when needed
- Suspense boundaries with loading states
- Reduced initial bundle size

### CSS Optimizations
- Custom scrollbar removal
- Theme transition utilities
- Mobile touch optimizations
- Focus management for accessibility

### TypeScript Benefits
- Type safety across components
- Interface reusability
- Better IDE support
- Reduced runtime errors

## 🔧 Development Guidelines

### Code Organization
- **Types**: Centralized in `/src/types`
- **Constants**: Organized in `/src/constants`
- **Styles**: Split between globals and utilities
- **Components**: Feature-based organization

### Best Practices
- **Imports**: Clean, optimized imports
- **Props**: TypeScript interfaces for all props
- **Styling**: Consistent dark mode variants
- **Performance**: Lazy loading where appropriate

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

## 📱 Mobile Considerations

### Responsive Design
- Mobile-first approach
- Touch-friendly interactions
- Optimized layouts for small screens

### Performance
- Lazy loading for better perceived performance
- Optimized images and assets
- Minimal JavaScript for mobile

### Accessibility
- Semantic HTML structure
- Focus management
- Screen reader support
- High contrast ratios

## 🌟 Future Enhancements

### Potential Features
- Real video data integration
- Search functionality
- Video playback
- User authentication
- Video uploads

### Performance Improvements
- Service worker implementation
- Advanced caching strategies
- Image optimization with CDN
- Bundle analysis and optimization

---

**Built with ❤️ using Next.js 15, TypeScript, and Tailwind CSS**
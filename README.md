# 🎬 YouTube Web App

A privacy-focused YouTube search and viewing application built with Next.js 15, featuring enhanced privacy controls, ad blocking, and a modern user interface.

## ✨ Features

### 🎥 Core Functionality
- **YouTube Search**: Search YouTube videos without tracking
- **Video Playback**: Watch videos in privacy-enhanced embed player
- **Video Details**: View video information, duration, and view counts
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme switching support

### 🔒 Privacy & Security
- **Privacy Modes**: Standard, Enhanced, and Strict privacy levels
- **Ad Blocking**: Built-in advertisement blocking
- **Tracking Protection**: Prevents YouTube tracking cookies
- **No Data Collection**: No personal data stored or shared
- **Secure Headers**: Comprehensive security headers configuration

### 🚀 Performance
- **Fast Loading**: Optimized bundle and lazy loading
- **Edge Caching**: Vercel Edge Network integration
- **Database Caching**: Video metadata caching for faster searches
- **Image Optimization**: WebP/AVIF format support
- **Code Splitting**: Optimized JavaScript bundles

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel Platform
- **Icons**: Lucide React
- **State Management**: Zustand + TanStack Query

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Vercel Postgres recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd youtube-web-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```bash
   DATABASE_URL="your_postgres_connection_string"
   DIRECT_URL="your_direct_postgres_connection_string"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with initial data

# Deployment
npm run vercel-build # Vercel-specific build
```

## 🌍 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npx vercel
   ```

2. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET` (optional)

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `DIRECT_URL` | Direct database connection | ✅ |
| `NEXTAUTH_SECRET` | Authentication secret | ❌ |
| `NEXT_PUBLIC_APP_URL` | Custom domain URL | ❌ |
| `Z_AI_API_KEY` | Z.AI SDK API key | ❌ |

### Feature Flags

```bash
NEXT_PUBLIC_ENABLE_ANALYTICS=true      # Enable analytics tracking
NEXT_PUBLIC_ENABLE_COMMENTS=true       # Enable video comments
NEXT_PUBLIC_ENABLE_RECOMMENDATIONS=true # Enable video recommendations
NEXT_PUBLIC_DEFAULT_PRIVACY_MODE=enhanced # Default privacy level
NEXT_PUBLIC_ENABLE_TRACKING_PROTECTION=true # Enable tracking protection
```

## 🏗️ Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── access-status.tsx
│   │   ├── privacy-badge.tsx
│   │   ├── privacy-policy.tsx
│   │   └── privacy-settings.tsx
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility libraries
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── vercel.json           # Vercel configuration
├── next.config.ts        # Next.js configuration
└── README.md             # This file
```

## 🔒 Privacy Features

### Privacy Modes

1. **Standard**: Basic privacy protection
2. **Enhanced**: Blocks most tracking and ads
3. **Strict**: Maximum privacy, limited functionality

### Security Headers

- **Content Security Policy**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **Strict-Transport-Security**: Enforces HTTPS
- **Referrer-Policy**: Controls referrer information

### Data Protection

- No cookies from YouTube
- No personal data collection
- No tracking scripts
- Local storage only for preferences

## 🎨 UI Components

### shadcn/ui Components

The app uses a comprehensive set of shadcn/ui components:

- **Layout**: Card, Separator, ScrollArea
- **Navigation**: Navigation Menu, Breadcrumb
- **Forms**: Input, Button, Select, Checkbox
- **Feedback**: Alert, Toast, Dialog
- **Data**: Table, Pagination, Badge
- **Media**: Aspect Ratio, Carousel

### Custom Components

- **PrivacyBadge**: Displays current privacy mode
- **PrivacySettings**: Privacy configuration panel
- **AccessStatus**: Shows external access status
- **VideoCard**: Video information display

## 📊 API Endpoints

### YouTube API
- `GET /api/youtube/search` - Search YouTube videos
- `GET /api/youtube/video` - Get video details

### Health Check
- `GET /api/health` - Application health status

### Authentication (Optional)
- NextAuth.js integration ready
- User session management
- OAuth providers support

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npm run type-check

# Build test
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Vercel](https://vercel.com/) - Deployment platform

## 📞 Support

For support and questions:

- Create an issue in the repository
- Check the [deployment guide](./DEPLOYMENT.md)
- Review the [documentation](./docs/)

---

**🎉 Enjoy a private, ad-free YouTube experience!**
# 🎬 NewPipe - Privacy-Focused YouTube Frontend

A modern, privacy-focused YouTube frontend application built with Next.js 15, featuring advanced functionality like background playback, subscriptions, playlists, and more.

## ✨ Features

### 🎥 Core Functionality
- **🎬 Video Player**: Full-featured player with ReactPlayer integration
- **🎵 Background Playback**: Mini-player for continuous listening
- **🔍 Search & Categories**: Advanced search with 9 content categories
- **📱 Responsive Design**: Mobile-first approach with perfect desktop adaptation

### 🎯 Advanced Features
- **📚 Subscriptions**: Channel subscription management
- **📝 Playlists**: Create and manage custom playlists
- **📖 Watch History**: Automatic history tracking
- **⭐ Bookmarks**: Save favorite videos
- **💾 Downloads**: Offline video management interface
- **🌙 Dark/Light Mode**: Complete theme switching

### 🔒 Privacy Protection
- **🚫 No Google Tracking**: Complete privacy protection
- **💾 Local Storage**: All data stored locally, no external servers
- **🔐 Anonymous Usage**: No account required for full functionality

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server (standard Next.js)
npm run dev

# Or start with custom server (includes Socket.IO)
npm run dev:custom

# Build for production
npm run build

# Start production server (standard Next.js)
npm start

# Or start with custom server
npm run start:custom
```

Open [http://localhost:3000](http://localhost:3000) to see the application running.

## 🏗️ Technology Stack

### 🎯 Core Framework
- **⚡ Next.js 15** - React framework with App Router
- **📘 TypeScript 5** - Type-safe development
- **🎨 Tailwind CSS 4** - Utility-first styling

### 🎬 Video & Media
- **🎥 ReactPlayer 3.3.3** - Video player with YouTube support
- **🎵 Audio Control** - Background playback functionality
- **🖼️ Image Processing** - Sharp for thumbnail optimization

### 🧩 UI Components
- **🧩 shadcn/ui** - High-quality accessible components
- **🎯 Lucide React** - Beautiful icon library
- **🌈 Framer Motion** - Smooth animations
- **🎨 Next Themes** - Dark/light mode support

### 🔄 State & Data
- **🐻 Zustand** - Lightweight state management with persistence
- **🔄 TanStack Query** - Server state management
- **🌐 Axios** - HTTP client with multiple user agents
- **📊 Cheerio** - Web scraping for YouTube data

## 📱 Application Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── newpipe/       # YouTube data fetching
│   │   ├── health/        # Health check
│   │   └── echo/          # WebSocket alternative
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── video-player.tsx   # Video player component
│   ├── video-card.tsx     # Video card component
│   ├── sidebar.tsx        # Navigation sidebar
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
└── lib/                  # Utilities & configurations
    ├── store.ts          # Zustand state management
    ├── socket.ts         # Socket.IO setup
    └── utils.ts          # Utility functions
```

## 🚀 Deployment

### Standard Deployment (Recommended)
For most deployment platforms (Vercel, Netlify, Railway, etc.):

```bash
# Build the application
npm run build

# Deploy using standard Next.js
npm start
```

### Custom Server Deployment
For platforms that support custom Node.js servers:

```bash
# Build the application
npm run build

# Start with custom server (includes Socket.IO)
npm run start:custom
```

### Environment Variables
Create a `.env` file:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

### Deployment Platforms

#### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

#### Netlify
1. Push your code to GitHub
2. Connect to Netlify
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Functions directory**: `netlify/functions`

#### Railway
1. Connect your GitHub repository
2. Railway will automatically detect Next.js
3. Configure environment variables

#### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuration

### YouTube API Configuration
The application uses web scraping with multiple user agents for robustness:

- **5 Different User Agents** for improved stability
- **Egypt Geographic Location** configuration
- **YouTube Mobile** endpoint (`m.youtube.com`)
- **Fallback System** with 5 simulated videos when scraping fails

### Video Player Settings
- **Controls Enabled**: Full YouTube player controls
- **Privacy Mode**: No tracking, minimal branding
- **Picture-in-Picture**: Background playback support
- **Speed Control**: 0.5x to 2x playback speed

### State Management
- **Persistent Storage**: History, bookmarks, subscriptions saved locally
- **Zustand**: Lightweight state management
- **Automatic Cleanup**: History limited to last 100 videos

## 🎨 UI/UX Features

### Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: 44px minimum touch targets
- **Smooth Animations**: Framer Motion transitions
- **Loading States**: Skeleton screens during data fetching

### Accessibility
- **Semantic HTML**: Proper ARIA labels and structure
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Compatible with assistive technologies
- **High Contrast**: Clear visual hierarchy

### Theme System
- **Dark Mode**: Default dark theme
- **Light Mode**: Toggle option available
- **System Preference**: Respects OS theme settings
- **Smooth Transitions**: Theme change animations

## 🛠️ Development

### Adding New Features
1. **Components**: Add new components in `src/components/`
2. **API Routes**: Create new endpoints in `src/app/api/`
3. **State Management**: Extend Zustand store in `src/lib/store.ts`
4. **Styling**: Use Tailwind CSS classes and shadcn/ui components

### Testing
```bash
# Run linting
npm run lint

# Build and check for errors
npm run build
```

### Common Issues
- **Videos not playing**: Check YouTube API access and network connectivity
- **Build errors**: Ensure all dependencies are installed
- **Deployment issues**: Use standard Next.js deployment for compatibility

## 🤝 Contributing

This application is designed to be a complete NewPipe alternative with modern web technologies. Feel free to contribute improvements or report issues.

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ for privacy-focused web applications. 🚀

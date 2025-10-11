import Head from 'next/head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'video';
  videoTitle?: string;
  videoDescription?: string;
  videoThumbnail?: string;
}

export function SEOHead({
  title = 'ماي يوتيوب - تطبيق يوتيوب عربي',
  description = 'تطبيق ويب عربي حديث لمشاهدة ومشاركة الفيديوهات من يوتيوب، مبني بأحدث التقنيات وجاهز للنشر على Vercel',
  keywords = ['يوتيوب', 'فيديو', 'عربي', 'مشاهدة', 'مشاركة', 'Next.js', 'TypeScript'],
  image = '/logo.svg',
  url = 'https://chat.z.ai',
  type = 'website',
  videoTitle,
  videoDescription,
  videoThumbnail
}: SEOHeadProps) {
  const fullTitle = videoTitle ? `${videoTitle} - ${title}` : title;
  const fullDescription = videoDescription || description;
  const fullImage = videoThumbnail || image;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'video' ? 'VideoObject' : 'WebSite',
    name: fullTitle,
    description: fullDescription,
    url: url,
    image: fullImage,
    publisher: {
      '@type': 'Organization',
      name: 'ماي يوتيوب',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.svg'
      }
    },
    ...(type === 'video' && {
      uploadDate: new Date().toISOString(),
      thumbnailUrl: fullImage
    })
  };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content="ماي يوتيوب" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow" />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="ماي يوتيوب" />
      <meta property="og:locale" content="ar_AR" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#000000" />
      <link rel="canonical" href={url} />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* RTL Support */}
      <html lang="ar" dir="rtl" />
    </Head>
  );
}
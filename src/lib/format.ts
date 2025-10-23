/**
 * Format video duration from seconds or ISO format to human-readable format
 * Examples:
 * - "PT4M13S" -> "4:13"
 * - "PT1H2M30S" -> "1:02:30"
 * - "253" -> "4:13"
 * - "3725" -> "1:02:05"
 */
export function formatDuration(duration: string | number | null | undefined): string {
  if (!duration) return '';
  
  // If it's already formatted (contains colon), return as is
  if (typeof duration === 'string' && duration.includes(':')) {
    return duration;
  }
  
  let totalSeconds = 0;
  
  // Parse ISO 8601 duration format (PT4M13S, PT1H2M30S, etc.)
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      totalSeconds = hours * 3600 + minutes * 60 + seconds;
    }
  } 
  // Parse numeric seconds
  else if (typeof duration === 'number') {
    totalSeconds = Math.floor(duration);
  }
  // Parse string number
  else if (typeof duration === 'string' && !isNaN(Number(duration))) {
    totalSeconds = Math.floor(Number(duration));
  }
  
  if (totalSeconds === 0) return '';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Format view count to human-readable format
 * Examples:
 * - 123 -> "123 views"
 * - 1234 -> "1.2K views"
 * - 1234567 -> "1.2M views"
 * - 1234567890 -> "1.2B views"
 */
export function formatViewCount(viewCount: string | number | null | undefined): string {
  if (!viewCount) return '';
  
  let count = 0;
  
  // Parse numeric value from string
  if (typeof viewCount === 'string') {
    // Remove any non-digit characters and parse
    const numericValue = viewCount.replace(/[^0-9]/g, '');
    count = parseInt(numericValue) || 0;
  } else if (typeof viewCount === 'number') {
    count = Math.floor(viewCount);
  }
  
  if (count === 0) return '0 views';
  
  if (count < 1000) {
    return `${count} views`;
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K views`;
  } else if (count < 1000000000) {
    return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M views`;
  } else {
    return `${(count / 1000000000).toFixed(1).replace(/\.0$/, '')}B views`;
  }
}

/**
 * Format published date to relative time
 * Examples:
 * - "2024-01-15" -> "2 months ago"
 * - "2023-12-01" -> "5 months ago"
 * - "2022-06-15" -> "2 years ago"
 */
export function formatPublishedDate(published: string | null | undefined): string {
  if (!published) return '';
  
  const date = new Date(published);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Format a number with commas
 * Examples:
 * - 1234 -> "1,234"
 * - 1234567 -> "1,234,567"
 */
export function formatNumber(num: number | string | null | undefined): string {
  if (!num) return '0';
  
  const number = typeof num === 'string' ? parseInt(num.replace(/[^0-9]/g, '')) || 0 : num;
  return number.toLocaleString();
}
import { redirect } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is a server component layout
  // The actual authentication check is done in the AdminAuthCheck client component
  return children;
}
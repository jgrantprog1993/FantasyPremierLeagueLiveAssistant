import { Geist, Geist_Mono } from 'next/font/google';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'FPL Dashboard',
  description: 'Fantasy Premier League Dashboard - Track your team, players, and live scores',
  keywords: ['FPL', 'Fantasy Premier League', 'Fantasy Football', 'Premier League'],
  authors: [{ name: 'FPL Dashboard' }],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FPL Dashboard',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#37003c',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}

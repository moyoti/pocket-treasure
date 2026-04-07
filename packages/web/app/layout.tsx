import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import BottomNav from '@/components/BottomNav';
import { MapboxProvider } from '@/components/MapboxProvider';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '寻宝记 - Treasure Hunt',
  description: '探索世界，收集宝藏 - 一个地理位置收集游戏',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className}`}>
        <ThemeProvider>
          <MapboxProvider>
            <LocaleProvider>
              <AccessibilityProvider>
                <AuthProvider>
                  <ToastProvider>
                    <div className="min-h-screen transition-colors duration-200">
                      {children}
                    </div>
                    <BottomNav />
                  </ToastProvider>
                </AuthProvider>
              </AccessibilityProvider>
            </LocaleProvider>
          </MapboxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
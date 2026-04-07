'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLocale } from '@/contexts/LocaleContext';
import { Map, Package, Award, User, ClipboardList, Store, Dices } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { t } = useLocale();

  // Don't show nav during auth loading or when not logged in
  if (loading || !user) {
    return null;
  }

  // Don't show nav on login and register pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const navItems: { href: string; labelKey: string; icon: LucideIcon; isCenter?: boolean }[] = [
    { href: '/inventory', labelKey: 'nav.inventory', icon: Package },
    { href: '/shop', labelKey: 'nav.shop', icon: Store },
    { href: '/map', labelKey: 'nav.map', icon: Map, isCenter: true },
    { href: '/chest-open', labelKey: 'nav.chestOpen', icon: Dices },
    { href: '/gacha', labelKey: 'nav.gacha', icon: Dices },
    { href: '/profile', labelKey: 'nav.profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-3 border-gray-200 z-50 safe-area-pb shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex justify-around items-end h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const IconComponent = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 touch-manipulation relative -mt-5"
              >
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-full border-4 shadow-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-400 border-yellow-500 scale-110'
                      : 'bg-gradient-to-br from-yellow-300 to-orange-300 border-yellow-400 hover:scale-105'
                  }`}
                >
                  <IconComponent
                    size={24}
                    strokeWidth={2.5}
                    className="text-gray-800"
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold leading-none mt-1 transition-colors ${
                    isActive ? 'text-amber-600' : 'text-gray-400'
                  }`}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 touch-manipulation relative"
            >
              <div
                className={`relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-100'
                    : 'hover:bg-gray-100'
                }`}
              >
                <IconComponent
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-amber-600' : 'text-gray-400'}
                />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold leading-none transition-colors ${
                  isActive ? 'text-amber-600' : 'text-gray-400'
                }`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

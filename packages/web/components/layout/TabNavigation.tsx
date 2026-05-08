'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TabItem {
  id: string;
  label: string;
  labelZh: string;
  icon: React.ReactNode;
  iconActive: React.ReactNode;
  href: string;
}

interface TabNavigationProps {
  tabs: TabItem[];
  className?: string;
}

function TabNavigation({ tabs, className = '' }: TabNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-30
        bg-white border-t border-border
        shadow-[0_-2px_8px_rgba(0,0,0,0.06)]
        ${className}
      `}
    >
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[64px]"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/5 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="relative z-10"
                >
                  <span className={isActive ? 'text-primary' : 'text-muted'}>
                    {isActive ? tab.iconActive : tab.icon}
                  </span>
                </motion.div>

                <motion.span
                  animate={{ opacity: isActive ? 1 : 0.6 }}
                  className={`
                    relative z-10 text-xs font-semibold mt-1
                    ${isActive ? 'text-primary' : 'text-muted'}
                  `}
                >
                  {tab.labelZh}
                </motion.span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function MapIcon({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      {!active && <circle cx="12" cy="9" r="2.5" />}
    </svg>
  );
}

function InventoryIcon({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      {!active && <polyline points="3.27 6.96 12 12.01 20.73 6.96" />}
      {!active && <line x1="12" y1="22.08" x2="12" y2="12" />}
    </svg>
  );
}

function AchievementIcon({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
      <path d="M12 15l-3.09 1.63.59-3.44-2.5-2.43 3.46-.5L12 6l1.54 3.16 3.46.5-2.5 2.43.59 3.44L12 15z" />
      {!active && <circle cx="12" cy="8" r="7" />}
    </svg>
  );
}

function ProfileIcon({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    </svg>
  );
}

function TasksIcon({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
      <path d="M9 11l3 3L22 4" />
      {!active && <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />}
    </svg>
  );
}

const defaultTabs: TabItem[] = [
  {
    id: 'map',
    label: 'Map',
    labelZh: '地图',
    icon: <MapIcon />,
    iconActive: <MapIcon active />,
    href: '/map',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    labelZh: '收藏',
    icon: <InventoryIcon />,
    iconActive: <InventoryIcon active />,
    href: '/inventory',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    labelZh: '任务',
    icon: <TasksIcon />,
    iconActive: <TasksIcon active />,
    href: '/tasks',
  },
  {
    id: 'achievements',
    label: 'Achievements',
    labelZh: '成就',
    icon: <AchievementIcon />,
    iconActive: <AchievementIcon active />,
    href: '/achievements',
  },
  {
    id: 'profile',
    label: 'Profile',
    labelZh: '我的',
    icon: <ProfileIcon />,
    iconActive: <ProfileIcon active />,
    href: '/profile',
  },
];

export { TabNavigation, defaultTabs };
export type { TabNavigationProps, TabItem };
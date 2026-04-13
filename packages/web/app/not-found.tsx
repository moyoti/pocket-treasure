'use client';

import { Map } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';

export default function NotFound() {
  const router = useRouter();
  const { t } = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      <div className="cartoon-card p-8 max-w-md w-full mx-4 text-center animate-bounce-in">
        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4 border-4 border-yellow-300">
          <Map size={40} className="text-yellow-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">{t('common.pageNotFound')}</h2>
        <p className="text-gray-600 mb-6">{t('common.treasureNotFound')}</p>
        <button
          onClick={() => router.push('/map')}
          className="cartoon-btn inline-block"
        >
          {t('common.backToMap')}
        </button>
      </div>
    </div>
  );
}
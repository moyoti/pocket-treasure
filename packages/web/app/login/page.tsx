'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useLocale } from '@/contexts/LocaleContext';
import { login } from '@/lib/api';
import {
  Map,
  Gem,
  AlertTriangle,
  Check,
  Mail,
  Lock,
  Loader2,
  Rocket,
  Chrome,
  Apple
} from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, setUser } = useAuth();
  const { t } = useLocale();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/map');
    }
    if (searchParams.get('registered') === 'true') {
      setSuccess(t('auth.registerSuccessPleaseLogin'));
    }
  }, [user, authLoading, router, searchParams]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="cartoon-loader"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await login(email, password);
      setUser(user);
      router.push('/map');
    } catch (err: any) {
      setError(err.message || t('auth.loginFailedCheckCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      <div className="w-full max-w-md animate-bounce-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4 animate-float">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg border-4 border-gray-800">
              <Map size={36} className="text-gray-800" />
            </div>
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-3 border-gray-800 -ml-4 mt-6">
              <Gem size={24} className="text-gray-800" />
            </div>
          </div>
          <h1 className="cartoon-title text-4xl md:text-5xl mb-2">{t('app.name')}</h1>
          <p className="text-lg text-gray-600 font-semibold">{t('auth.exploreWorldCollectTreasures')}</p>
        </div>

        <div className="cartoon-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="cartoon-alert cartoon-alert-error animate-shake flex items-center gap-2">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            {success && (
              <div className="cartoon-alert cartoon-alert-success flex items-center gap-2">
                <Check size={18} /> {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Mail size={16} /> {t('auth.email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cartoon-input w-full"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Lock size={16} /> {t('auth.password')}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cartoon-input w-full"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cartoon-btn w-full text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> {t('auth.loggingIn')}
                </>
              ) : (
                <>
                  <Rocket size={20} /> {t('auth.startAdventure')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t-2 border-gray-200"></div>
            <span className="px-4 text-gray-400 font-bold text-sm">{t('common.or')}</span>
            <div className="flex-1 border-t-2 border-gray-200"></div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              className="cartoon-btn cartoon-btn-secondary w-full flex items-center justify-center gap-2"
              disabled
            >
              <Chrome size={20} />
              <span>{t('auth.googleLogin')}</span>
              <span className="text-xs opacity-60">({t('auth.comingSoon')})</span>
            </button>
            <button
              type="button"
              className="cartoon-btn w-full flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(180deg, #333 0%, #111 100%)', color: 'white' }}
              disabled
            >
              <Apple size={20} />
              <span>{t('auth.appleLogin')}</span>
              <span className="text-xs opacity-60">({t('auth.comingSoon')})</span>
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-gray-600 font-semibold">
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="text-yellow-600 hover:text-yellow-700 font-bold underline decoration-2 underline-offset-2">
            {t('auth.registerNow')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="cartoon-loader"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
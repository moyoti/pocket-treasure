'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { register } from '@/lib/api';
import {
  Map,
  Gem,
  AlertTriangle,
  User,
  Mail,
  Lock,
  Loader2,
  Rocket,
} from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/map');
    }
  }, [user, authLoading, router]);

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

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要6位');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, username);
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      <div className="w-full max-w-md animate-bounce-in">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4 animate-float">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg border-4 border-gray-800">
              <Map size={36} className="text-gray-800" />
            </div>
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-3 border-gray-800 -ml-4 mt-6">
              <Gem size={24} className="text-gray-800" />
            </div>
          </div>
          <h1 className="cartoon-title text-4xl md:text-5xl mb-2">创建账号</h1>
          <p className="text-lg text-gray-600 font-semibold">开始你的寻宝之旅</p>
        </div>

        {/* Register card */}
        <div className="cartoon-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="cartoon-alert cartoon-alert-error animate-shake flex items-center gap-2">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <User size={16} /> 用户名
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="cartoon-input w-full"
                placeholder="探险家"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Mail size={16} /> 邮箱
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
                <Lock size={16} /> 密码 (至少6位)
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
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          password.length >= level * 3
                            ? level <= 1 ? 'bg-red-400' : level <= 2 ? 'bg-yellow-400' : level <= 3 ? 'bg-green-400' : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 font-medium ${
                    password.length < 6 ? 'text-red-500' : password.length < 8 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {password.length < 6 ? '密码太短' : password.length < 8 ? '密码强度一般' : '密码强度良好'}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cartoon-btn w-full text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> 注册中...
                </>
              ) : (
                <>
                  <Rocket size={20} /> 开始探险
                </>
              )}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-gray-600 font-semibold">
          已有账号？{' '}
          <Link href="/login" className="text-yellow-600 hover:text-yellow-700 font-bold underline decoration-2 underline-offset-2">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
}

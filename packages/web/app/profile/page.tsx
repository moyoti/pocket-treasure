'use client';

import { useP2P } from '@/lib/p2p';
import { Loading } from '@/components/ui/Loading';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

export default function ProfilePage() {
  const { identity, profile, isLoading } = useP2P();

  if (isLoading) {
    return <Loading fullScreen text="加载中..." />;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="text-center mb-6">
        <div className="w-24 h-24 rounded-full bg-primary mx-auto flex items-center justify-center text-white text-3xl font-bold mb-3">
          {profile?.displayName?.charAt(0) || 'E'}
        </div>
        <h1 className="text-xl font-bold">{profile?.displayName || 'Explorer'}</h1>
        <p className="text-sm text-muted font-mono">
          {identity?.publicKey?.slice(0, 8)}...{identity?.publicKey?.slice(-8)}
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-muted">金币</span>
            <span className="text-xl font-bold text-primary">{profile?.coins || 0}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Link href="/profile/stats">
          <Card hoverable>
            <CardContent className="p-4 flex justify-between items-center">
              <span>📊 统计数据</span>
              <span className="text-muted">→</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile/settings">
          <Card hoverable>
            <CardContent className="p-4 flex justify-between items-center">
              <span>⚙️ 设置</span>
              <span className="text-muted">→</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile/help">
          <Card hoverable>
            <CardContent className="p-4 flex justify-between items-center">
              <span>❓ 帮助</span>
              <span className="text-muted">→</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile/about">
          <Card hoverable>
            <CardContent className="p-4 flex justify-between items-center">
              <span>ℹ️ 关于</span>
              <span className="text-muted">→</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
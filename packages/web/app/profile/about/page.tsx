'use client';

import { Card, CardContent } from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold text-primary mb-4">ℹ️ 关于</h1>

      <Card className="mb-4">
        <CardContent className="p-4 text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <h2 className="text-xl font-bold">寻宝记</h2>
          <p className="text-muted">Treasure Hunt</p>
          <p className="text-sm text-muted mt-2">版本 1.0.0</p>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="font-bold mb-2">技术栈</h3>
          <ul className="text-sm text-muted space-y-1">
            <li>• Next.js 14</li>
            <li>• React 18</li>
            <li>• Tailwind CSS</li>
            <li>• Leaflet Maps</li>
            <li>• IndexedDB (Dexie)</li>
            <li>• Ed25519 签名</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold mb-2">P2P 离线游戏</h3>
          <p className="text-sm text-muted">
            本游戏采用点对点架构，所有数据存储在您的设备本地。
            无需服务器，无需网络连接，完全离线运行。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { Card, CardContent } from '@/components/ui/Card';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold text-primary mb-4">❓ 帮助</h1>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">🗺️ 如何收集宝藏?</h3>
            <p className="text-muted text-sm">
              在地图页面，靠近宝藏标记，点击即可收集。每个宝藏有不同的稀有度。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">🎰 扭蛋系统</h3>
            <p className="text-muted text-sm">
              使用金币进行扭蛋抽奖，有机会获得稀有物品。每10连抽保底稀有物品。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">⚗️ 合成系统</h3>
            <p className="text-muted text-sm">
              将多个低稀有度物品合成为高稀有度物品。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">📱 离线游戏</h3>
            <p className="text-muted text-sm">
              本游戏完全离线运行，所有数据存储在本地。无需网络连接。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
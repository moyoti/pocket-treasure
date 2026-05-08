'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold text-primary mb-4">⚙️ 设置</h1>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span>主题</span>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                浅色
              </Button>
              <Button
                variant={theme === 'dark' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                深色
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span>语言</span>
            <span className="text-muted">中文</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardContent className="p-4">
          <h3 className="font-bold text-red-500 mb-2">危险操作</h3>
          <Button variant="outline" className="text-red-500 border-red-300">
            重置所有数据
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
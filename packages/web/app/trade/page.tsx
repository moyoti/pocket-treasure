'use client';

import { useP2P } from '@/lib/p2p';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';

export default function TradePage() {
  const { tradeHistory, nearbyTraders, isLoading } = useP2P();

  if (isLoading) {
    return <Loading fullScreen text="加载交易..." />;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <h1 className="text-2xl font-bold text-primary mb-4">🔄 交易</h1>

      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="font-bold mb-2">附近玩家</h3>
          {nearbyTraders.length === 0 ? (
            <p className="text-muted text-sm">暂无附近玩家</p>
          ) : (
            <div className="space-y-2">
              {nearbyTraders.map((trader) => (
                <div key={trader.deviceId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{trader.displayName}</span>
                  <Button variant="outline" size="sm">交易</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <h3 className="font-bold mb-2">交易历史</h3>
      <div className="space-y-2">
        {tradeHistory.map((trade) => (
          <Card key={trade.id}>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{trade.partnerDisplayName || '匿名玩家'}</p>
                  <p className="text-xs text-muted">
                    {new Date(trade.tradedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-sm ${
                  trade.tradeStatus === 'completed' ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {trade.tradeStatus === 'completed' ? '已完成' : '进行中'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {tradeHistory.length === 0 && (
          <p className="text-muted text-center py-4">暂无交易记录</p>
        )}
      </div>
    </div>
  );
}
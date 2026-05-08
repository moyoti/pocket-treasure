'use client';

import { useP2P } from '@/lib/p2p';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { RarityBadge } from '@/components/ui/RarityBadge';

export default function AchievementsPage() {
  const { achievements, claimAchievement, isLoading } = useP2P();

  if (isLoading) {
    return <Loading fullScreen text="加载成就..." />;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <h1 className="text-2xl font-bold text-primary mb-4">🏆 成就</h1>

      <div className="grid gap-4">
        {achievements.map((ua) => {
          return (
            <Card key={ua.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-2xl mb-1">🏆</div>
                    <h3 className="font-bold">{ua.achievementId}</h3>
                    <p className="text-sm text-muted">进度: {ua.progress}</p>
                  </div>
                </div>

                {ua.status === 'completed' && !ua.claimedAt && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => claimAchievement(ua.achievementId)}
                  >
                    领取奖励
                  </Button>
                )}

                {ua.status === 'claimed' && (
                  <span className="text-sm text-muted">✓ 已领取</span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
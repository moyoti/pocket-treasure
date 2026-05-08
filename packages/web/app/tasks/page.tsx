'use client';

import { useP2P } from '@/lib/p2p';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';

export default function TasksPage() {
  const { dailyTasks, claimDailyTask, isLoading, refreshDailyTasks } = useP2P();

  if (isLoading) {
    return <Loading fullScreen text="加载任务..." />;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <h1 className="text-2xl font-bold text-primary mb-4">📋 每日任务</h1>

      <div className="grid gap-4">
        {dailyTasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">{task.taskDefinitionId}</h3>
                  <p className="text-sm text-muted">
                    进度: {task.currentProgress} / ?
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-sm ${
                  task.status === 'claimed' ? 'bg-gray-200 text-gray-500' :
                  task.status === 'completed' ? 'bg-green-100 text-green-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {task.status === 'claimed' ? '已领取' :
                   task.status === 'completed' ? '已完成' : '进行中'}
                </div>
              </div>

              {task.status === 'completed' && !task.claimedAt && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => claimDailyTask(task.taskDefinitionId)}
                >
                  领取奖励
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {dailyTasks.length === 0 && (
          <div className="text-center text-muted py-10">
            <p>暂无任务</p>
          </div>
        )}
      </div>
    </div>
  );
}
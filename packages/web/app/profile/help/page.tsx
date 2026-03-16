'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  ChevronRight,
  HelpCircle,
  FileText,
  Shield,
  MessageCircle,
  Map,
  Trophy,
  BarChart2,
  Handshake,
  MapPin,
  RefreshCw,
  Gem,
  Medal,
  Clock,
  HelpCircle as FAQ,
  Scroll,
  Mail,
  Twitter,
  Lightbulb,
} from 'lucide-react';

const faqs = [
  {
    question: '如何收集宝藏？',
    answer: '打开地图，寻找附近的宝藏标记。当你距离宝藏50米以内时，点击标记即可收集。宝藏会显示不同的稀有度，越稀有的宝藏出现概率越低。',
    icon: Map,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    question: '宝藏会过期吗？',
    answer: '是的，每个宝藏会在生成后24小时过期。请及时收集你喜欢的宝藏！过期后，该位置会生成新的宝藏。',
    icon: Clock,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    question: '如何获得更多成就？',
    answer: '通过收集宝藏、探索新的地点、连续登录等方式可以获得成就。查看成就页面了解具体的达成条件。',
    icon: Trophy,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
  },
  {
    question: '排行榜是如何计算的？',
    answer: '排行榜根据玩家收集的宝藏总数量进行排名。收集越多稀有度高的宝藏，排名越靠前。',
    icon: BarChart2,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    question: '我可以交易或赠送宝藏吗？',
    answer: '目前不支持交易或赠送功能。每个宝藏都是独一无二的收藏品，专属于你的探险记录。',
    icon: Handshake,
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
];

const gameRules = [
  {
    title: '收集半径',
    description: '必须距离宝藏50米以内才能收集',
    icon: MapPin,
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    title: '刷新机制',
    description: '新宝藏每小时在各个地点随机生成',
    icon: RefreshCw,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
  },
  {
    title: '稀有度系统',
    description: '普通 > 稀有 > 史诗 > 传说',
    icon: Gem,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
  },
  {
    title: '成就系统',
    description: '完成特定目标解锁专属成就徽章',
    icon: Medal,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
];

export default function HelpPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="cartoon-loader"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/profile')}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-600" />
            <h1 className="text-xl font-black text-gray-800">帮助中心</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-page-enter">
        {/* 快速链接 */}
        <div className="cartoon-card p-4">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            快速链接
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="#faq"
              className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 text-center hover:bg-yellow-100 transition flex flex-col items-center gap-2"
            >
              <FAQ className="w-6 h-6 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-700">常见问题</span>
            </a>
            <a
              href="#rules"
              className="bg-green-50 border-2 border-green-300 rounded-xl p-3 text-center hover:bg-green-100 transition flex flex-col items-center gap-2"
            >
              <Scroll className="w-6 h-6 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">游戏规则</span>
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <section id="faq" className="space-y-3">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-500" />
            常见问题
          </h2>
          {faqs.map((faq, index) => {
            const IconComponent = faq.icon;
            return (
              <div key={index} className="cartoon-card p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${faq.bg}`}>
                    <IconComponent className={`w-5 h-5 ${faq.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-2">{faq.question}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Game Rules Section */}
        <section id="rules" className="space-y-3">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            游戏规则
          </h2>
          <div className="cartoon-card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameRules.map((rule, index) => {
                const IconComponent = rule.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${rule.bg}`}>
                      <IconComponent className={`w-5 h-5 ${rule.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{rule.title}</h3>
                      <p className="text-gray-600 text-xs">{rule.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="cartoon-card p-4">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            联系我们
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">电子邮箱</p>
                <p className="text-gray-600 text-xs">support@treasurehunt.game</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">官方社区</p>
                <p className="text-gray-600 text-xs">加入我们的 Discord 社区</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                <Twitter className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">社交媒体</p>
                <p className="text-gray-600 text-xs">关注 @TreasureHuntGame</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tips */}
        <div className="cartoon-card p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            小提示
          </h3>
          <p className="text-gray-600 text-sm">
            记得经常查看地图，宝藏会定期刷新。探索新的区域可以发现更多稀有宝藏！
            开启位置权限以获得最佳游戏体验。
          </p>
        </div>

        {/* Version */}
        <p className="text-center text-gray-400 text-sm">
          寻宝记 v1.0.0
        </p>
      </div>
    </div>
  );
}

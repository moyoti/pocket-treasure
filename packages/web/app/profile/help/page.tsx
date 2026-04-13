'use client';

import { useAuth } from '@/components/AuthProvider';
import { useLocale } from '@/contexts/LocaleContext';
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

export default function HelpPage() {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const faqs = [
    {
      question: t('help.howToCollect'),
      answer: t('help.howToCollectAnswer'),
      icon: Map,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      question: t('help.treasureExpire'),
      answer: t('help.treasureExpireAnswer'),
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      question: t('help.howToEarnAchievements'),
      answer: t('help.howToEarnAchievementsAnswer'),
      icon: Trophy,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
    },
    {
      question: t('help.leaderboardCalculation'),
      answer: t('help.leaderboardCalculationAnswer'),
      icon: BarChart2,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      question: t('help.canITrade'),
      answer: t('help.canITradeAnswer'),
      icon: Handshake,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
  ];

  const gameRules = [
    {
      title: t('help.collectionRadius'),
      description: t('help.collectionRadiusDesc'),
      icon: MapPin,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      title: t('help.spawnMechanism'),
      description: t('help.spawnMechanismDesc'),
      icon: RefreshCw,
      color: 'text-teal-500',
      bg: 'bg-teal-50',
    },
    {
      title: t('help.raritySystem'),
      description: t('help.raritySystemDesc'),
      icon: Gem,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
    },
    {
      title: t('help.achievementSystem'),
      description: t('help.achievementSystemDesc'),
      icon: Medal,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
  ];

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
            <h1 className="text-xl font-black text-gray-800">{t('help.title')}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-page-enter">
        {/* 快速链接 */}
        <div className="cartoon-card p-4">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            {t('help.quickLinks')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="#faq"
              className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 text-center hover:bg-yellow-100 transition flex flex-col items-center gap-2"
            >
              <FAQ className="w-6 h-6 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-700">{t('help.faq')}</span>
            </a>
            <a
              href="#rules"
              className="bg-green-50 border-2 border-green-300 rounded-xl p-3 text-center hover:bg-green-100 transition flex flex-col items-center gap-2"
            >
              <Scroll className="w-6 h-6 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">{t('help.gameRules')}</span>
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <section id="faq" className="space-y-3">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-500" />
            {t('help.faq')}
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
            {t('help.gameRules')}
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
            {t('help.contactUs')}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{t('help.email')}</p>
                <p className="text-gray-600 text-xs">support@treasurehunt.game</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{t('help.community')}</p>
                <p className="text-gray-600 text-xs">{t('help.communityDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                <Twitter className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{t('help.socialMedia')}</p>
                <p className="text-gray-600 text-xs">{t('help.followUs')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tips */}
        <div className="cartoon-card p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            {t('help.tips')}
          </h3>
          <p className="text-gray-600 text-sm">
            {t('help.tipMessage')}
          </p>
        </div>

        {/* Version */}
        <p className="text-center text-gray-400 text-sm">
          {t('help.version')}
        </p>
      </div>
    </div>
  );
}

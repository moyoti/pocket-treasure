'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { ChevronLeft, Heart, Star, Github, Mail, Globe, Map, Smartphone, Code, Wrench } from 'lucide-react';

export default function AboutPage() {
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/profile" className="text-gray-600 hover:text-gray-800 transition">
            <ChevronLeft size={28} />
          </Link>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Star className="w-6 h-6 text-amber-500" />关于</h1>
          <div className="w-7"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 animate-page-enter">
        {/* App Info Card */}
        <div className="cartoon-card p-8 text-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border-4 border-gray-800 shadow-lg">
            <Map className="w-12 h-12 text-gray-800" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-2">寻宝记</h1>
          <p className="text-gray-500 mb-4">Treasure Hunt</p>
          <div className="inline-block bg-yellow-100 border-2 border-yellow-400 rounded-full px-4 py-1">
            <span className="font-bold text-yellow-700">版本 1.0.0</span>
          </div>
        </div>

        {/* Description */}
        <div className="cartoon-card p-6 mb-6">
          <h2 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2"><Smartphone className="w-5 h-5 text-blue-500" />应用简介</h2>
          <p className="text-gray-600 leading-relaxed">
            寻宝记是一款基于地理位置的物品收集游戏，类似于 Pokémon GO。
            玩家可以在真实世界中探索，在各个地标位置收集虚拟宝藏物品。
            收集稀有物品，完成成就，与其他玩家竞争排名！
          </p>
        </div>

        {/* Tech Stack */}
        <div className="cartoon-card p-6 mb-6">
          <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Wrench className="w-5 h-5 text-gray-600" />技术栈</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Web 前端', tech: 'Next.js 14' },
              { name: '移动端', tech: 'React Native + Expo' },
              { name: '后端', tech: 'NestJS' },
              { name: '数据库', tech: 'PostgreSQL + PostGIS' },
              { name: '地图服务', tech: '高德地图' },
              { name: '认证', tech: 'JWT + OAuth' }
            ].map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-3 border-2 border-gray-200">
                <p className="text-xs text-gray-500">{item.name}</p>
                <p className="font-bold text-gray-800">{item.tech}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="cartoon-card p-6 mb-6">
          <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-indigo-500" />链接</h2>
          <div className="space-y-3">
            <a
              href="https://github.com/treasure-hunt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-200 hover:bg-gray-100 transition"
            >
              <Github size={20} className="text-gray-700" />
              <span className="font-medium text-gray-800">GitHub 仓库</span>
            </a>
            <a
              href="https://treasurehunt.game"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-200 hover:bg-gray-100 transition"
            >
              <Globe size={20} className="text-gray-700" />
              <span className="font-medium text-gray-800">官方网站</span>
            </a>
            <a
              href="mailto:support@treasurehunt.game"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-200 hover:bg-gray-100 transition"
            >
              <Mail size={20} className="text-gray-700" />
              <span className="font-medium text-gray-800">联系邮箱</span>
            </a>
          </div>
        </div>

        {/* Open Source */}
        <div className="cartoon-card p-6 mb-6">
          <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Code className="w-5 h-5 text-green-500" />开源许可</h2>
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
            <p className="text-gray-800 font-medium mb-2">MIT License</p>
            <p className="text-gray-500 text-sm">
              本项目基于 MIT 许可证开源，欢迎贡献代码和提出建议。
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart size={20} className="text-red-500" />
            <span className="text-gray-600">Made with love</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2024 Treasure Hunt. All rights reserved.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            探索世界，收集宝藏，享受游戏乐趣！
          </p>
        </div>

        {/* Terms and Privacy */}
        <div className="flex justify-center gap-4 text-sm">
          <Link href="/terms" className="text-primary hover:underline">
            服务条款
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/privacy" className="text-primary hover:underline">
            隐私政策
          </Link>
        </div>
      </div>
    </div>
  );
}
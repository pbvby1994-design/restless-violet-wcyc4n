// Файл: webapp/pages/index.js
"use client"; // Оставляем, так как страница использует клиентский код

import dynamic from 'next/dynamic';
import Generator from '@/components/Generator';
import MiniPlayer from '@/components/MiniPlayer';

// ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Динамический импорт Layout с отключенным SSR.
// Это гарантирует, что WebApp SDK внутри Layout.js будет инициализирован только в браузере.
const DynamicLayout = dynamic(() => import('@/components/Layout'), { 
    ssr: false 
});

export default function IndexPage() {
  return (
    <DynamicLayout>
      <Generator />
      <MiniPlayer />
    </DynamicLayout>
  );
}

// Файл: webapp/pages/index.js
"use client"; 

import dynamic from 'next/dynamic';

// ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Динамический импорт для всех компонентов, использующих клиентские API/хуки/библиотеки.
// Layout использует TWA SDK.
const DynamicLayout = dynamic(() => import('@/components/Layout'), { 
    ssr: false 
});
// Generator использует клиентскую логику, контекст.
const DynamicGenerator = dynamic(() => import('@/components/Generator'), { 
    ssr: false 
});
// MiniPlayer использует window.audioPlayer (Audio API).
const DynamicMiniPlayer = dynamic(() => import('@/components/MiniPlayer'), { 
    ssr: false 
});


export default function IndexPage() {
  return (
    <DynamicLayout>
      <DynamicGenerator />
      <DynamicMiniPlayer />
    </DynamicLayout>
  );
}

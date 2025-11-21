// Файл: webapp/pages/library.js
"use client"; 

import dynamic from 'next/dynamic';

// ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Динамический импорт для всех компонентов.
const DynamicLayout = dynamic(() => import('@/components/Layout'), { 
    ssr: false 
});
// Library использует useState, useEffect, Firebase (клиентский DB).
const DynamicLibrary = dynamic(() => import('@/components/Library'), { 
    ssr: false 
});
// MiniPlayer использует window.audioPlayer (Audio API).
const DynamicMiniPlayer = dynamic(() => import('@/components/MiniPlayer'), { 
    ssr: false 
});


export default function LibraryPage() {
  // ⚠️ Убедитесь, что usePlayer и playSpeech импортированы и доступны здесь, 
  // если вы решите реализовать эту логику.
  const handlePlayFromLibrary = (record) => {
    // const { setAudioUrl, setCurrentText, playSpeech } = usePlayer();
    // setAudioUrl(record.audioUrl);
    // setCurrentText(record.text);
    // playSpeech();
  };
  
  return (
    <DynamicLayout>
      <DynamicLibrary onPlay={handlePlayFromLibrary} />
      <DynamicMiniPlayer />
    </DynamicLayout>
  );
}

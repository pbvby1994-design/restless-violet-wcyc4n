// Файл: webapp/pages/library.js
"use client"; // Оставляем, так как страница использует клиентский код

import dynamic from 'next/dynamic';
import Library from '@/components/Library';
import MiniPlayer from '@/components/MiniPlayer';

// ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Динамический импорт Layout с отключенным SSR.
const DynamicLayout = dynamic(() => import('@/components/Layout'), { 
    ssr: false 
});

export default function LibraryPage() {
  // Логика handlePlayFromLibrary остается в этом файле
  const handlePlayFromLibrary = (record) => {
    // const { setAudioUrl, setCurrentText, playSpeech } = usePlayer();
    // setAudioUrl(record.audioUrl);
    // setCurrentText(record.text);
    // playSpeech();
  };
  
  return (
    <DynamicLayout>
      <Library onPlay={handlePlayFromLibrary} />
      <MiniPlayer />
    </DynamicLayout>
  );
}

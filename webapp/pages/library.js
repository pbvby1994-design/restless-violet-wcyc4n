// Файл: webapp/pages/library.js
"use client"; // <-- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ

import Layout from '@/components/Layout';
import Library from '@/components/Library';
import MiniPlayer from '@/components/MiniPlayer';
// import { usePlayer } from '@/context/PlayerContext'; // Раскомментируйте, когда будете реализовывать логику

export default function LibraryPage() {
  // const { setAudioUrl, setCurrentText, playSpeech } = usePlayer();

  const handlePlayFromLibrary = (record) => {
    // Реализуйте здесь логику воспроизведения из библиотеки
    // setAudioUrl(record.audioUrl);
    // setCurrentText(record.text);
    // playSpeech();
  };
  
  return (
    <Layout>
      <Library onPlay={handlePlayFromLibrary} />
      <MiniPlayer />
    </Layout>
  );
}

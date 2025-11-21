// Файл: webapp/pages/index.js
"use client"; // <-- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ

import Generator from '@/components/Generator';
import Layout from '@/components/Layout';
import MiniPlayer from '@/components/MiniPlayer';

export default function IndexPage() {
  return (
    <Layout>
      <Generator />
      <MiniPlayer />
    </Layout>
  );
}

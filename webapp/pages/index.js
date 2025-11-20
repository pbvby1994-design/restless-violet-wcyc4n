// Файл: webapp/pages/index.js

import React, { useState } from 'react';
// 🛑 УДАЛИТЕ эти обычные импорты:
// import Generator from '@/components/Generator';
// import Library from '@/components/Library';
// import MiniPlayer from '@/components/MiniPlayer';

// ✅ ДОБАВЬТЕ динамический импорт:
import dynamic from 'next/dynamic';

// ✅ ИСПРАВЛЕНИЕ: Динамический импорт с отключением SSR.
// Это предотвратит попытку выполнения кода, зависящего от `window`,
// во время сборки на Vercel.
const Generator = dynamic(() => import('@/components/Generator'), { ssr: false });
const Library = dynamic(() => import('@/components/Library'), { ssr: false });
const MiniPlayer = dynamic(() => import('@/components/MiniPlayer'), { ssr: false });


// Компоненты для навигации
const TabButton = ({ tabName, activeTab, onClick }) => {
// ... (остальной код TabButton без изменений)
// ...
};


/**
 * Главная страница приложения, управляющая состоянием вкладок.
 */
const Home = () => {
    // ... (остальной код Home без изменений)
    
    return (
        <div className="flex flex-col space-y-4">
            
            {/* 1. Блок навигации по вкладкам */}
            {/* ... (код навигации) ... */}
            
            {/* 2. Отображение активного контента */}
            <div className="card-glass p-4">
                {activeTab === 'Генератор речи' && <Generator />}
                {activeTab === 'Библиотека' && <Library />}
            </div>

            {/* 3. Мини-плеер */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                <MiniPlayer />
            </div>
        </div>
    );
};

export default Home;

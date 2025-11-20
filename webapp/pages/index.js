// Файл: webapp/pages/index.js
import React, { useState } from 'react';
import Generator from '@/components/Generator';
import Library from '@/components/Library';
import MiniPlayer from '@/components/MiniPlayer';

// Компоненты для навигации
const TabButton = ({ tabName, activeTab, onClick }) => {
    // Определяем, активна ли текущая вкладка
    const isActive = activeTab === tabName;
    
    // Используем классы Tailwind для стилизации вкладок
    const baseClasses = "flex-1 text-center py-2 text-sm font-semibold cursor-pointer transition-colors duration-200 rounded-lg";
    
    // Активный стиль: accent-neon
    const activeClasses = "bg-accent-neon text-white shadow-neon";
    
    // Неактивный стиль: полупрозрачный фон и secondary текст
    const inactiveClasses = "bg-bg-glass/50 text-txt-secondary hover:bg-bg-glass/80";

    return (
        <button
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            onClick={() => onClick(tabName)}
        >
            {tabName}
        </button>
    );
};


/**
 * Главная страница приложения, управляющая состоянием вкладок.
 */
const Home = () => {
    // Используем 'Генератор речи' как вкладку по умолчанию
    const [activeTab, setActiveTab] = useState('Генератор речи');

    return (
        <div className="flex flex-col space-y-4">
            
            {/* 1. Блок навигации по вкладкам */}
            <div className="flex space-x-2 p-1 card-glass shadow-none bg-bg-glass/50">
                <TabButton 
                    tabName="Генератор речи" 
                    activeTab={activeTab} 
                    onClick={setActiveTab} 
                />
                <TabButton 
                    tabName="Библиотека" 
                    activeTab={activeTab} 
                    onClick={setActiveTab} 
                />
            </div>
            
            {/* 2. Отображение активного контента */}
            <div className="card-glass p-4">
                {activeTab === 'Генератор речи' && <Generator />}
                {activeTab === 'Библиотека' && <Library />}
            </div>

            {/* 3. Мини-плеер (находится под контентом, если есть активное аудио) */}
            <MiniPlayer />
        </div>
    );
};

export default Home;

// Файл: webapp/components/Header.js
import React from 'react';

/**
 * Заглушка компонента Header.
 * В будущем здесь можно разместить логотип, навигацию или элементы управления TWA.
 */
export default function Header() {
  return (
    // Используем классы Tailwind для придания стилю приложения
    <header className="p-4 bg-bg-card border-b border-white/5 shadow-md sticky top-0 z-10">
      <div className="max-w-lg mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-txt-primary">
          TTS App
        </h1>
        {/* Здесь могут быть кнопки настроек или навигации */}
        <div className="text-sm text-txt-secondary">
          {/* Пустой контейнер для будущих элементов */}
        </div>
      </div>
    </header>
  );
}

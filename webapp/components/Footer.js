// Файл: webapp/components/Footer.js
import React from 'react';

/**
 * Заглушка компонента Footer.
 * В будущем здесь можно разместить информацию об авторских правах или ссылки.
 */
export default function Footer() {
  return (
    // Прикрепляем футер к низу области просмотра
    <footer className="w-full p-3 bg-bg-card border-t border-white/5 mt-auto">
      <div className="max-w-lg mx-auto text-center text-xs text-txt-muted">
        © 2025 TTS WebApp. Сборка готова к развертыванию.
      </div>
    </footer>
  );
}

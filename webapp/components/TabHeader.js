import React from 'react';
import { motion } from 'framer-motion';

/**
 * Компонент заголовка, содержащий кнопки для переключения между вкладками.
 * @param {string} activeTab - Текущая активная вкладка ('generator' или 'library').
 * @param {function} setActiveTab - Функция для установки активной вкладки.
 */
const TabHeader = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'generator', label: 'Генератор речи' },
    { id: 'library', label: 'Библиотека' },
  ];

  return (
    <div className="flex justify-start border-b border-txt-muted/50 relative">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            px-4 py-2 text-lg font-semibold relative transition-colors duration-200
            ${activeTab === tab.id 
              ? 'text-accent-neon' // Активная вкладка - неоновый акцент
              : 'text-txt-secondary hover:text-txt-primary' // Неактивная вкладка
            }
          `}
        >
          {tab.label}
          {/* Неоновый индикатор активной вкладки */}
          {activeTab === tab.id && (
            <motion.div
              className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-accent-neon rounded-t-sm shadow-neon-light"
              layoutId="underline"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default TabHeader;

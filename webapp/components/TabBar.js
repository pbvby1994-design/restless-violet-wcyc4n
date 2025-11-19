import { motion } from 'framer-motion';
import { BookOpen, Mic, Settings, Music } from 'lucide-react'; 
import { usePlayer } from '../context/PlayerContext'; 

// Иконки для табов
const LibraryIcon = ({ active }) => <BookOpen size={24} className={active ? "text-accent" : "text-txt-secondary"} />;
const SettingsIcon = ({ active }) => <Settings size={24} className={active ? "text-accent" : "text-txt-secondary"} />;

/**
 * Нижняя панель навигации (TabBar)
 * Использует плавающую центральную кнопку для основного действия (TTS или FullPlayer).
 * * @param {string} activeTab - ID активной вкладки ('library', 'tts', 'settings').
 * @param {function} setActiveTab - Функция для смены вкладки.
 * @param {function} onOpenFullPlayer - Функция для открытия полноэкранного плеера.
 */
export default function TabBar({ activeTab, setActiveTab, onOpenFullPlayer }) {
  const { currentTrack } = usePlayer();

  // Основные табы, отображаемые внизу
  const tabs = [
    { id: 'library', label: 'Библиотека', icon: LibraryIcon },
    { id: 'settings', label: 'Профиль', icon: SettingsIcon },
  ];
  
  // Центральная кнопка: TTS или FullPlayer
  const centerAction = {
    id: 'center',
    label: currentTrack ? 'Плеер' : 'Генерация',
    // Mic (генерация) или Music (плеер)
    icon: currentTrack ? Music : Mic,
    // Если есть трек, открываем FullPlayer, иначе переходим на вкладку 'tts'
    onClick: currentTrack ? onOpenFullPlayer : () => setActiveTab('tts'),
    // Цвет кнопки: Акцентный для плеера, Синий для генерации
    color: currentTrack ? 'bg-accent shadow-neon-sm' : 'bg-blue-600 shadow-lg shadow-blue-500/50',
  };

  // Создаем место для центральной кнопки в нижней панели
  const tabsWithPlaceholder = [tabs[0], { id: 'placeholder' }, tabs[1]];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 select-none">
      <div className="relative mx-auto max-w-md">
        {/* Фон TabBar с эффектом стекла */}
        <div className="bg-bg-card backdrop-blur-xl border border-white/10 rounded-3xl shadow-neon flex justify-around items-center h-16">
          
          {tabsWithPlaceholder.map((tab) => (
            <motion.div
              key={tab.id}
              className={`flex flex-col items-center justify-center w-1/3 h-full ${tab.id === 'placeholder' ? 'opacity-0 pointer-events-none' : ''}`}
            >
              {tab.id !== 'placeholder' && (
                <motion.button
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                    activeTab === tab.id 
                      ? 'text-accent' 
                      : 'text-txt-secondary hover:text-white'
                  }`}
                >
                  <tab.icon active={activeTab === tab.id} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Плавающая Центральная Кнопка */}
        <motion.button
          onClick={centerAction.onClick}
          whileTap={{ scale: 0.9 }}
          // Стили для плавающей кнопки: смещение вверх, круглая, цвет, граница
          className={`absolute -top-7 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full ${centerAction.color} flex items-center justify-center border-4 border-[#0B0F15] text-white transition-all duration-300`}
        >
          {/* Иконка меняется и пульсирует, если играет трек */}
          <centerAction.icon size={28} className={currentTrack ? "animate-pulse" : ""} />
        </motion.button>

      </div>
      {/* Мини-плеер будет располагаться ВНЕ TabBar, в компоненте Layout, если потребуется */}
    </div>
  );
}

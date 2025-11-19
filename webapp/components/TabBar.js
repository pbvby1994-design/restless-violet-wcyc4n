import { motion } from 'framer-motion';

// Иконки (SVG)
const LibraryIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#6A5BFF" : "none"} stroke={active ? "#6A5BFF" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const PlayerIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#6A5BFF" : "none"} stroke={active ? "#6A5BFF" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" fill={active ? "currentColor" : "none"}/>
  </svg>
);

const SettingsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#6A5BFF" : "none"} stroke={active ? "#6A5BFF" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1.51-1V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default function TabBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'library', label: 'Главная', icon: LibraryIcon },
    { id: 'player', label: 'Плеер', icon: PlayerIcon },
    { id: 'settings', label: 'Профиль', icon: SettingsIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
      <div className="mx-auto max-w-md bg-white/10 dark:bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-glass flex justify-around items-center h-20">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileTap={{ scale: 0.9 }}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${
              activeTab === tab.id 
                ? 'text-brand-accent dark:text-brand-accent' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <tab.icon active={activeTab === tab.id} />
            <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-2 w-1 h-1 bg-brand-accent rounded-full"
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

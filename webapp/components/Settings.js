import { motion } from 'framer-motion';
import { User, Volume2, Shield, Settings as SettingsIcon } from 'lucide-react';

/**
 * Компонент-заглушка для экрана "Настройки" или "Профиль".
 * Включает эффект "стекла" и минимальный UI.
 */
export default function Settings() {
  const tapEffect = { scale: 0.98 };
  
  // Данные для имитации настроек
  const settingsCategories = [
    { 
      title: "Аккаунт", 
      icon: User, 
      description: "Ваш Telegram ID и статус подписки.",
      status: "Basic" 
    },
    { 
      title: "Голос", 
      icon: Volume2, 
      description: "Выбор акцентного голоса и скорости по умолчанию.",
      status: "Kore (Жен.)" 
    },
    { 
      title: "Приватность", 
      icon: Shield, 
      description: "Настройки безопасности и политики данных.",
      status: "Защищено" 
    },
  ];

  return (
    <div className="p-4 max-w-md mx-auto pt-6 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="mb-6 text-center"
      >
        <SettingsIcon className="mx-auto text-accent-neon mb-2" size={32} />
        <h1 className="text-3xl font-extrabold text-white mb-2">Настройки & Профиль</h1>
        <p className="text-txt-secondary text-sm">Управление голосами, подпиской и общие настройки приложения.</p>
      </motion.div>

      <div className="space-y-4">
        {settingsCategories.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileTap={tapEffect}
            className="card-glass flex items-center justify-between cursor-pointer hover:bg-white/10"
          >
            <div className="flex items-center space-x-4">
              <item.icon className="text-accent-neon flex-shrink-0" size={24} />
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">{item.title}</h3>
                <p className="text-txt-muted text-xs hidden sm:block">{item.description}</p>
              </div>
            </div>
            
            <span className="text-sm font-medium text-txt-secondary bg-white/5 py-1 px-3 rounded-full border border-white/10 flex-shrink-0">
              {item.status}
            </span>
          </motion.div>
        ))}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 p-4 text-center rounded-xl bg-white/5 border border-white/10"
      >
        <p className="text-txt-secondary text-sm">
          Для изменения некоторых настроек может потребоваться перезапуск приложения Telegram.
        </p>
      </motion.div>
    </div>
  );
}

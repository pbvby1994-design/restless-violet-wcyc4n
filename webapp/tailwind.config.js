/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Включаем ручное переключение темы
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Премиальный шрифт
      },
      colors: {
        // Палитра "Cosmic Dark" (как на референсе)
        dark: {
          bg: '#0C0C0F',       // Глубокий фон
          card: '#1C1C1E',     // Карточки
          surface: '#111217',  // Поверхности
        },
        // Акцентные цвета (Neon/Blurple)
        brand: {
          primary: '#4B56F0',
          accent: '#6A5BFF',
          glow: '#00D2FF',
        }
      },
      boxShadow: {
        'glow': '0 0 20px rgba(106, 91, 255, 0.5)', // Неоновое свечение
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

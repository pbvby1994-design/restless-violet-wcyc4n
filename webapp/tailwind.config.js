/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Основной фон - Глубокий космос
        bg: {
          DEFAULT: '#0B0F15', 
          card: 'rgba(255, 255, 255, 0.03)', // Стекло для карточек
          glass: 'rgba(255, 255, 255, 0.04)',
        },
        // Текст
        txt: {
          primary: '#FFFFFF',
          secondary: '#9EA8B7',
          muted: '#5E6470',
        },
        // Фиолетовый неон (Акцентный цвет)
        accent: {
          light: '#A46CFF',
          DEFAULT: '#8850FF', 
          deep: '#2D166F',
          neon: '#B06EFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Современный шрифт
        serif: ['Georgia', 'serif'], 
      },
      boxShadow: {
        'neon': '0 0 25px rgba(136, 80, 255, 0.3)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'wave': 'wave 1.5s ease-in-out infinite', // Анимация эквалайзера
      },
      keyframes: {
        wave: {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

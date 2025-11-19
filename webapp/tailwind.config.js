/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
 
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Цвета, адаптированные для темной темы и WebApp
        'bg-default': '#0B0F15', // Темный фон
        'bg-card': 'rgba(255, 255, 255, 0.03)', // Для карточек (стеклянный эффект)
        'bg-glass': 'rgba(255, 255, 255, 0.04)', // Для инпутов
        'txt-primary': '#FFFFFF', // Основной текст
        'txt-secondary': '#9EA8B7', // Второстепенный текст/подсказки
        'txt-muted': '#5E6470', // Мутированный текст
        'accent-neon': '#B06EFF', // Неоновый акцент
        'accent-light': '#A46CFF', // Акцент для эффекта hover
      },
      boxShadow: {
        // Неоновая тень для кнопок
        'neon': '0 0 15px rgba(136, 80, 255, 0.4)',
        // Тень для карточек
        'card': '0 4px 12px rgba(0, 0, 0, 0.2)',
      },
      fontFamily: {
        // Используем Inter по умолчанию
        sans: ['Inter', 'sans-serif'],
      },
      // Добавляем задержки для анимации (например, для лоадеров)
      animationDelay: {
        '200': '200ms',
        '400': '400ms',
      }
    },
  },
  plugins: [],
}

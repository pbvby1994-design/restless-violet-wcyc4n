// Файл: tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    // Убедитесь, что пути соответствуют структуре Codesandbox
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      "./app/**/*.{js,ts,jsx,tsx}", // На случай, если Codesandbox использует App Router
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }
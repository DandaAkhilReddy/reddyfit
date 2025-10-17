/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Islanders Team Colors
        'island-blue': {
          50: '#e6f2ff',
          100: '#cce5ff',
          200: '#99ccff',
          300: '#66b2ff',
          400: '#3399ff',
          500: '#0066CC', // Primary Island Blue
          600: '#0052a3',
          700: '#003d7a',
          800: '#002952',
          900: '#001429',
        },
        'cricket-green': {
          50: '#f0f8f0',
          100: '#d9f0d9',
          200: '#b3e0b3',
          300: '#8cd18c',
          400: '#66c166',
          500: '#228B22', // Cricket Green
          600: '#1b6f1b',
          700: '#145314',
          800: '#0e380e',
          900: '#071c07',
        },
        'texas-gold': {
          50: '#fff9e6',
          100: '#fff2cc',
          200: '#ffe599',
          300: '#ffd966',
          400: '#ffcc33',
          500: '#FFB81C', // Texas Gold
          600: '#cc9316',
          700: '#996e11',
          800: '#664a0b',
          900: '#332506',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

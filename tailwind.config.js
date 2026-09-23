/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0b',
          900: '#0e0e10',
          850: '#131316',
          800: '#1a1a1e',
          700: '#232328',
          600: '#2e2e35',
          500: '#3a3a42',
          400: '#52525b',
        },
        cream: {
          50: '#fbf8f1',
          100: '#f5efe2',
          200: '#ebe0cc',
          300: '#dcc9a8',
          400: '#c9ad82',
        },
        gold: {
          400: '#d4a843',
          500: '#c4982f',
          600: '#a87d1f',
          700: '#876316',
        },
        amber: {
          500: '#e08a3c',
          600: '#c9742a',
        },
        rust: {
          500: '#b85c38',
          600: '#9c4a2a',
        },
        teal: {
          500: '#3a8a8a',
          600: '#2e6e6e',
        },
        signal: {
          green: '#5cb85c',
          amber: '#e0a838',
          red: '#d44a3a',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', '"Oswald"', 'sans-serif'],
        heading: ['"Archivo"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'spin-reverse-slow': 'spin-reverse 8s linear infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'meter-bounce': 'meter-bounce 1.2s ease-in-out infinite',
      },
      keyframes: {
        'spin-reverse': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'shimmer': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'meter-bounce': {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
};

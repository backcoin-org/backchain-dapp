/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './*.js',
    './pages/**/*.js',
    './modules/**/*.js',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'bounce-slow': 'bounce-slow 3s infinite ease-in-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'construct-hammer': 'construct-hammer 2s ease-in-out infinite',
        'construct-gear': 'spin 10s linear infinite',
        'construct-gear-rev': 'spin 10s linear infinite reverse',
        'fadeIn': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(5%)' },
        },
        'construct-hammer': {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(30deg)' },
        },
        'fadeIn': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};

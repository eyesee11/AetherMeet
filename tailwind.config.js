/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/js/**/*.js",
    "./public/**/*.html",
    "./client/src/**/*.{js,jsx,ts,tsx}",
    "./client/public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
        'sans': ['JetBrains Mono', 'Consolas', 'Monaco', 'system-ui', 'monospace']
      },
      colors: {
        // Neo-Brutalism Retro Palette
        'retro': {
          'bg': '#fafaf9',        // Off-white background
          'bg-secondary': '#f5f5f4', // Slightly darker off-white
          'card': '#ffffff',       // Pure white for cards
          'text': '#0a0a0a',      // Pure black text
          'text-secondary': '#404040', // Dark gray text
          'border': '#0a0a0a',    // Black borders
          'accent': '#0a0a0a',    // Black accent
        },
        'retro-dark': {
          'bg': '#0a0a0a',        // Pure black background
          'bg-secondary': '#1a1a1a', // Dark gray
          'card': '#262626',       // Lighter black for cards
          'text': '#fafaf9',      // Off-white text
          'text-secondary': '#a3a3a3', // Light gray text
          'border': '#fafaf9',    // Off-white borders
          'accent': '#fafaf9',    // Off-white accent
        },
        // Keep original colors for legacy support
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-lg': '8px 8px 0px 0px #000000',
        'brutal-xl': '12px 12px 0px 0px #000000',
        'brutal-inset': 'inset 4px 4px 0px 0px #000000',
        'brutal-white': '4px 4px 0px 0px #fafaf9',
        'brutal-white-lg': '8px 8px 0px 0px #fafaf9',
        'brutal-white-xl': '12px 12px 0px 0px #fafaf9',
        // Legacy shadows
        'neo': '4px 4px 0px 0px rgba(0,0,0,1)',
        'neo-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'neo-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
        'neo-dark': '4px 4px 0px 0px rgba(229,231,235,1)',
        'neo-dark-sm': '2px 2px 0px 0px rgba(229,231,235,1)',
        'neo-dark-lg': '8px 8px 0px 0px rgba(229,231,235,1)',
      },
      animation: {
        'bounce-subtle': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'typing-pulse': 'typingPulse 1.4s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        typingPulse: {
          '0%, 80%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}

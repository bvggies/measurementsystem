/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D2136', // Royal Navy
          navy: '#0D2136',
          gold: '#D4A643', // Tailor Gold
          gray: '#586577', // Steel Gray
          white: '#FAFAFA', // Soft White
          success: '#00A68C', // Emerald Green
          error: '#E43F52', // Crimson Edge
        },
        'primary-navy': '#0D2136',
        'primary-gold': '#D4A643',
        steel: '#586577',
        'soft-white': '#FAFAFA',
        emerald: '#00A68C',
        crimson: '#E43F52',
        // Dark mode colors
        'dark-bg': '#1a1a1a',
        'dark-surface': '#2d2d2d',
        'dark-text': '#e5e5e5',
        'dark-border': '#404040',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
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
      },
    },
  },
  plugins: [],
}


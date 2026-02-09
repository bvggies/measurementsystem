/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Brand colors from Settings – use CSS variables so they apply when saved */
        primary: {
          DEFAULT: 'var(--color-primary-navy, #0D2136)',
          navy: 'var(--color-primary-navy, #0D2136)',
          gold: 'var(--color-primary-gold, #D4A643)',
          gray: 'var(--color-steel, #586577)',
          white: 'var(--color-soft-white, #FAFAFA)',
          success: 'var(--color-emerald, #00A68C)',
          error: 'var(--color-crimson, #E43F52)',
        },
        'primary-navy': 'var(--color-primary-navy, #0D2136)',
        'primary-gold': 'var(--color-primary-gold, #D4A643)',
        steel: 'var(--color-steel, #586577)',
        'soft-white': 'var(--color-soft-white, #FAFAFA)',
        emerald: 'var(--color-emerald, #00A68C)',
        crimson: 'var(--color-crimson, #E43F52)',
        // Dark mode colors (fixed)
        'dark-bg': '#1a1a1a',
        'dark-surface': '#2d2d2d',
        'dark-text': '#e5e5e5',
        'dark-border': '#404040',
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
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-8px) translateX(4px) rotate(2deg)' },
          '66%': { transform: 'translateY(4px) translateX(-6px) rotate(-1deg)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(6px, -6px)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 12s ease-in-out infinite',
        'drift': 'drift 15s ease-in-out infinite',
        'spin-slow': 'spinSlow 30s linear infinite',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px -5px rgba(13, 33, 54, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 10px -4px rgba(0, 0, 0, 0.04)',
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
}


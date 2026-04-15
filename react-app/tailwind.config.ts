import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#03070e',
        },
        cyan: {
          500: '#06b6d4',
          400: '#22d3ee',
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glassmorphism': 'glassmorphism 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glassmorphism': {
          'from': { opacity: '0', backdropFilter: 'blur(0px)' },
          'to': { opacity: '1', backdropFilter: 'blur(16px)' },
        },
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
      backgroundColor: {
        'glass': 'rgba(15, 23, 42, 0.6)',
        'glass-light': 'rgba(15, 23, 42, 0.8)',
      },
      borderColor: {
        'glass': 'rgba(6, 182, 212, 0.2)',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config

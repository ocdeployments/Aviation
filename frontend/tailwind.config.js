/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Courier New'", 'monospace'],
        sans: ["'Inter'", 'system-ui', 'sans-serif'],
      },
      colors: {
        slate: {
          750: '#1e293b',
        },
      },
      animation: {
        'fly-across': 'fly-across 2s ease-in-out infinite',
        'radar-sweep': 'radar-sweep 2s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'particle-drift': 'particle-drift 60s linear infinite',
        'ticker-scroll': 'ticker-scroll 30s linear infinite',
        'ring-expand': 'ring-expand 2s ease-out infinite',
        'count-in': 'count-in 0.4s ease-out both',
      },
      keyframes: {
        'fly-across': {
          '0%':   { transform: 'translateX(-100%) rotate(-10deg)', opacity: '0' },
          '10%':  { opacity: '1' },
          '90%':  { opacity: '1' },
          '100%': { transform: 'translateX(200%) rotate(-10deg)', opacity: '0' },
        },
        'radar-sweep': {
          '0%':   { transform: 'rotate(0deg)', opacity: '0.8' },
          '100%': { transform: 'rotate(360deg)', opacity: '0.8' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'particle-drift': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%':      { transform: 'translateY(-20px) translateX(10px)' },
        },
        'ticker-scroll': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'ring-expand': {
          '0%':   { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'count-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
      },
    },
  },
  plugins: [],
}

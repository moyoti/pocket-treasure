module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D4A017',
        secondary: '#9B59B6',
        background: '#FFF8E7',
        card: '#FFFFFF',
        border: '#F0E8D8',
        text: '#1A1A1A',
        muted: '#AAA',
        success: '#22c55e',
        error: '#dc2626',
        rare: '#3b82f6',
        epic: '#a855f7',
        legendary: '#F59E0B',
        common: '#8D99AE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
      },
    },
  },
  plugins: [],
}
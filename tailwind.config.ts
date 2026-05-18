import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAF7F2',
        accent: '#C2553D',
        text: '#1A1A1A',
        muted: '#6B6B6B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        btn: '12px',
        card: '16px',
      },
      maxWidth: {
        content: '480px',
      },
    },
  },
  plugins: [],
} satisfies Config

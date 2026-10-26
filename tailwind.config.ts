import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        foreground: '#0f172a',
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#1e3a5f',
          900: '#0f172a',
          950: '#0a0f1d',
        },
        brand: {
          blue: '#2563eb',
          indigo: '#4f46e5',
          purple: '#7c3aed',
        },
        status: {
          weak: {
            bg: '#fef2f2',
            border: '#fecaca',
            text: '#b91c1c',
            badge: '#ef4444',
          },
          medium: {
            bg: '#fffbeb',
            border: '#fde68a',
            text: '#b45309',
            badge: '#f59e0b',
          },
          strong: {
            bg: '#f0fdf4',
            border: '#bbf7d0',
            text: '#15803d',
            badge: '#10b981',
          },
          untested: {
            bg: '#f1f5f9',
            border: '#e2e8f0',
            text: '#475569',
            badge: '#94a3b8',
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;

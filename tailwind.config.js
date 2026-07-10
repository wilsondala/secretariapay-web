/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        imetro: {
          navy: '#07142D',
          navySoft: '#0D1F3D',
          gold: '#D7A928',
          goldSoft: '#F5E7B8',
          surface: '#F8FAFC',
          ink: '#0F172A',
        },
        brand: {
          primary: '#2563EB',
          hover: '#1D4ED8',
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
          institutional: '#0F766E',
        },
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, .08)',
        premium: '0 18px 52px rgba(15, 23, 42, .09)',
      },
    },
  },
  plugins: [],
};

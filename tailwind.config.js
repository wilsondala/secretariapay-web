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
          blue: '#005AA7',
          blueSoft: '#007DB8',
          navy: '#082B4B',
          navySoft: '#061F36',
          gold: '#F2B300',
          goldSoft: '#FDE68A',
          surface: '#F2F5F9',
          border: '#E6F0FB',
          ink: '#0F172A',
          muted: '#64748B',
        },
        brand: {
          primary: '#005AA7',
          hover: '#007DB8',
          success: '#16A34A',
          warning: '#F2B300',
          danger: '#DC2626',
          institutional: '#082B4B',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(8, 43, 75, .08)',
        premium: '0 10px 30px rgba(8, 43, 75, .08)',
      },
    },
  },
  plugins: [],
};

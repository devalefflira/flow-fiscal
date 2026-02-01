/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121214',
        surface: '#202024',
        surfaceHover: '#29292E',
        input: '#121214',
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
        brand: {
          cyan: '#0891B2',
          dark: '#121214'
        },
        eisenhower: {
          do: '#EF4444',
          schedule: '#F59E0B',
          delegate: '#06B6D4',
          delete: '#10B981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // --- NOVA ANIMAÇÃO AQUI ---
      keyframes: {
        breathing: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' }, // Cresce 15%
        }
      },
      animation: {
        'breathing': 'breathing 2s ease-in-out infinite', // Loop infinito de 2 segundos
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}
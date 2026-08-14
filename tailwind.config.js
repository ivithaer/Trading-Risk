/** @type{import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        base: {
          900: '#0A0D14',
          800: '#0F1320',
          700: '#131722',
          600: '#1A1F2E',
          500: '#252A3A',
          400: '#3A4156',
        },
        profit: {
          DEFAULT: '#16C784',
          dark: '#0E8F5F',
          light: '#3DDBA0',
        },
        loss: {
          DEFAULT: '#EA3943',
          dark: '#B11B24',
          light: '#FF5C65',
        },
        gold: {
          DEFAULT: '#F0B90B',
          dark: '#C99A00',
          light: '#FFD640',
        },
        ink: {
          primary: '#EAECEF',
          secondary: '#8B92A5',
          muted: '#5C6275',
        },
      },
      animation: {
        'flash-green': 'flashGreen 0.6s ease-out',
        'flash-red': 'flashRed 0.6s ease-out',
        'float-up': 'floatUp 1s ease-out forwards',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        'count-up': 'countUp 0.4s ease-out',
      },
      keyframes: {
        flashGreen: {
          '0%': { backgroundColor: 'rgba(22, 199, 132, 0.15)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashRed: {
          '0%': { backgroundColor: 'rgba(234, 57, 67, 0.15)' },
          '100%': { backgroundColor: 'transparent' },
        },
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-40px)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(240, 185, 11, 0.4)' },
          '70%': { boxShadow: '0 0 0 16px rgba(240, 185, 11, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(240, 185, 11, 0)' },
        },
        countUp: {
          '0%': { transform: 'scale(1.15)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

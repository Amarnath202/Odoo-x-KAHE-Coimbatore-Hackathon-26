/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#714B67',
          dark: '#5E3F56',
          light: '#8A5E7E',
        },
        accent: {
          DEFAULT: '#00A09D',
          dark: '#008582',
        },
        bg: {
          DEFAULT: '#FFFFFF',
          surface: '#F6F6F6',
          light: '#EEEEEE',
        },
        text: {
          primary: '#4C4C4C',
          secondary: '#707070',
          muted: '#9E9E9E',
        },
        border: {
          DEFAULT: '#E5E7EB',
        },
        status: {
          draft: '#707070',
          confirmed: '#00A09D',
          partial: '#E0A800',
          done: '#218838',
          cancelled: '#C82333',
          progress: '#E0A800',
        },
        success: '#218838',
        warning: '#E0A800',
        danger: '#C82333',
        info: '#00A09D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        input: '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        glow: '0 0 20px rgba(113,75,103,0.15)',
        'glow-accent': '0 0 20px rgba(0,160,157,0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

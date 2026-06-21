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
          DEFAULT: 'var(--color-primary)',
          dark:    'var(--color-primary-dark)',
          light:   'var(--color-primary-light)',
          pale:    'var(--color-primary-pale)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          dark:    'var(--color-accent-dark)',
          light:   'var(--color-accent-light)',
        },
        bg: {
          DEFAULT: 'var(--color-bg)',
          surface: 'var(--color-bg-surface)',
          light:   'var(--color-bg-light)',
          muted:   'var(--color-bg-muted)',
        },
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
        status: {
          draft:     '#6b7280',
          confirmed: '#00A09D',
          partial:   '#d97706',
          done:      '#16a34a',
          cancelled: '#dc2626',
          progress:  '#9333ea',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger:  'var(--color-danger)',
        info:    'var(--color-info)',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Caveat', 'cursive'],
      },
      borderRadius: {
        card:  '14px',
        btn:   '8px',
        input: '8px',
        xl:    '16px',
      },
      boxShadow: {
        card:         '0 1px 4px rgba(0,0,0,0.07), 0 2px 8px rgba(113,75,103,0.06)',
        glow:         '0 0 20px rgba(113,75,103,0.18)',
        'glow-accent':'0 0 20px rgba(0,160,157,0.18)',
        'lift':       '0 4px 16px rgba(0,0,0,0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-in':  'slideIn 0.3s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'pulse-slow':'pulse 3s infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(-16px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(16px)',  opacity: '0' }, '100%': { transform: 'translateY(0)',  opacity: '1' } },
      },
    },
  },
  plugins: [],
}

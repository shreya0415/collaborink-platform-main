import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      /* ─── Colors ─── */
      colors: {
        // Legacy aliases kept so existing code doesn't break
        primary: '#3B82F6',
        secondary: '#1F2937',
        accent: '#10B981',

        // Ink palette — the true dark base
        ink: {
          950: '#040810',
          900: '#070b16',
          800: '#0c1220',
          700: '#111827',
          600: '#18243a',
          500: '#1e2f4a',
        },

        // Aurora accent palette
        aurora: {
          teal:   '#2dd4bf',
          indigo: '#6366f1',
          violet: '#8b5cf6',
          cyan:   '#06b6d4',
          rose:   '#f43f5e',
        },

        // Gray-750 — fills the gap Tailwind leaves between 700 and 800
        // (used by existing chat and kanban code)
        gray: {
          750: '#2b3544',
        },
      },

      /* ─── Typography ─── */
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.02em' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.03em',
        tight:    '-0.02em',
        normal:   '0em',
        wide:     '0.02em',
        wider:    '0.08em',
        widest:   '0.16em',
      },

      /* ─── Shadows ─── */
      boxShadow: {
        'float':     '0 25px 60px -15px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.055)',
        'float-sm':  '0 12px 28px -8px rgba(0,0,0,.6),  0 0 0 1px rgba(255,255,255,.04)',
        'card':      '0 1px 0 0 rgba(255,255,255,.055) inset, 0 20px 50px -20px rgba(0,0,0,.7)',
        'glow-teal': '0 0 32px -8px rgba(45,212,191,.45)',
        'glow-indigo':'0 0 32px -8px rgba(99,102,241,.45)',
        'glow-sm':   '0 0 16px -4px rgba(45,212,191,.3)',
        'inner-top': '0 1px 0 rgba(255,255,255,.07) inset',
        'none':      'none',
      },

      /* ─── Background images ─── */
      backgroundImage: {
        'aurora-bg':
          'radial-gradient(ellipse at 15% -5%, rgba(99,102,241,.18) 0%, transparent 45%), radial-gradient(ellipse at 85% 5%, rgba(45,212,191,.13) 0%, transparent 40%), radial-gradient(ellipse at 50% 110%, rgba(139,92,246,.1) 0%, transparent 50%)',
        'mesh-card':
          'radial-gradient(at 0% 0%, rgba(45,212,191,.08) 0px, transparent 60%), radial-gradient(at 100% 100%, rgba(99,102,241,.06) 0px, transparent 60%)',
        'shimmer':
          'linear-gradient(90deg, rgba(30,41,59,0) 0%, rgba(51,65,85,.5) 50%, rgba(30,41,59,0) 100%)',
      },

      /* ─── Border radius ─── */
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      /* ─── Backdrop blur ─── */
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },

      /* ─── Animations ─── */
      animation: {
        'float':       'float 7s ease-in-out infinite',
        'float-slow':  'float 11s ease-in-out infinite',
        'float-fast':  'float 4s ease-in-out infinite',
        'pulse-glow':  'pulse-glow 3.5s ease-in-out infinite',
        'shimmer':     'shimmer 1.8s linear infinite',
        'fade-up':     'fade-up 0.45s ease forwards',
        'fade-in':     'fade-in 0.3s ease forwards',
        'spin-slow':   'spin 10s linear infinite',
        'aurora-drift':'aurora-drift 20s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)  rotate(0deg)' },
          '33%':      { transform: 'translateY(-10px) rotate(1.2deg)' },
          '66%':      { transform: 'translateY(-5px)  rotate(-0.6deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%':      { opacity: '0.65', transform: 'scale(1.06)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'aurora-drift': {
          '0%, 100%': { transform: 'translate(0, 0)    scale(1)',    opacity: '0.5' },
          '33%':      { transform: 'translate(2%, -2%) scale(1.04)', opacity: '0.7' },
          '66%':      { transform: 'translate(-1%, 1%) scale(0.97)', opacity: '0.45' },
        },
      },

      /* ─── Easing ─── */
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      /* ─── Spacing extras ─── */
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

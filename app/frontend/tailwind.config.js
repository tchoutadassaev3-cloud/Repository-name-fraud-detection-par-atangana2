/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          primary: '#003E7E',
          secondary: '#0056A6',
          light: '#0070CC',
        },
        afg: {
          green: '#22C55E',
          red: '#D71920',
        },
        danger: {
          DEFAULT: '#D71920',
          light: '#FF2D36',
          dark: '#A01015',
          muted: 'rgba(215,25,32,0.15)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
          muted: 'rgba(245,158,11,0.15)',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
          muted: 'rgba(16,185,129,0.15)',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
          muted: 'rgba(59,130,246,0.15)',
        },
        bg: {
          DEFAULT: '#0B1220',
          card: '#111827',
          sidebar: '#0F172A',
          elevated: '#1A2234',
          input: '#1E293B',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
          inverse: '#0B1220',
        },
        border: {
          DEFAULT: '#1E293B',
          light: '#2D3748',
          focus: '#0056A6',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(15,23,42,0.95) 100%)',
        'gradient-brand': 'linear-gradient(135deg, #003E7E 0%, #0056A6 100%)',
        'gradient-danger': 'linear-gradient(135deg, #D71920 0%, #A01015 100%)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
        'glow-brand': '0 0 20px rgba(0,86,166,0.3)',
        'glow-danger': '0 0 20px rgba(215,25,32,0.3)',
        'glow-success': '0 0 20px rgba(16,185,129,0.3)',
        'glow-warning': '0 0 20px rgba(245,158,11,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

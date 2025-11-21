

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1F2937',
        secondary: '#6B7280',
        accent: '#9CA3AF',
        bgLight: '#F9FAFB',
        cardBg: '#FFFFFF',
        border: '#E5E7EB',
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        hover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        card: '12px',
      }
    }
  },
  plugins: [],
}


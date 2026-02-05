/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Refined dark palette - neutral blacks, no purple undertone
        // Nike/Apple clean + Equinox sophistication
        dark: {
          950: '#050505',  // Pure black - deepest
          900: '#0a0a0a',  // Near black - primary bg
          800: '#141414',  // Elevated surfaces
          700: '#1c1c1c',  // Cards, inputs
          600: '#262626',  // Borders, dividers
          500: '#3a3a3a',  // Secondary borders, hover states
          400: '#525252',  // Muted text
        },
        // Gold's Gym inspired accent - bold, confident, classic iron
        accent: {
          primary: '#D4A853',     // Rich gold - main actions
          primaryHover: '#E4B863', // Lighter gold for hover
          primaryMuted: '#B8934A', // Darker gold for pressed
          secondary: '#F5F5F5',   // Off-white - clean contrast
          tertiary: '#8B8B8B',    // Steel gray - subtle accents
          success: '#4ADE80',     // Vibrant green
          warning: '#FBBF24',     // Amber warning
          danger: '#F87171',      // Soft red
        },
        // Text colors for hierarchy
        text: {
          primary: '#FFFFFF',
          secondary: '#A3A3A3',
          muted: '#737373',
        }
      },
      fontFamily: {
        // Clean body font (Apple/Nike)
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Bold display font for headers (Gold's Gym ruggedness)
        display: ['Oswald', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Refined type scale
        'display-xl': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'gold': '0 0 20px rgba(212, 168, 83, 0.15)',
        'gold-lg': '0 0 40px rgba(212, 168, 83, 0.2)',
        'inner-gold': 'inset 0 1px 0 rgba(212, 168, 83, 0.1)',
      }
    },
  },
  plugins: [],
}

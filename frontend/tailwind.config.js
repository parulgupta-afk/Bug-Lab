/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: '#090b13',
        panel: '#0e111c',
        'panel-2': '#121725',
        violet: '#a78bfa',
        cyan: '#67e8f9',
        mint: '#8ce8be',
        amber: '#f5c86b',
      },
      boxShadow: {
        glow: '0 0 26px rgba(167, 139, 250, 0.12)',
        'glow-cyan': '0 0 20px rgba(103, 232, 249, 0.12)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        'surface-subtle': 'rgb(var(--color-surface-subtle-rgb) / <alpha-value>)',
        accent: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
        'accent-dark': 'rgb(var(--color-accent-dark-rgb) / <alpha-value>)',
        'accent-light': 'rgb(var(--color-accent-light-rgb) / <alpha-value>)',
        'text-main': 'rgb(var(--color-text-main-rgb) / <alpha-value>)',
        charcoal: 'rgb(var(--color-charcoal-rgb) / <alpha-value>)',
        taupe: 'rgb(var(--color-taupe-rgb) / <alpha-value>)',
        sage: 'rgb(var(--color-sage-rgb) / <alpha-value>)',
        alert: 'rgb(var(--color-alert-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 30px -4px rgba(0, 0, 0, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}

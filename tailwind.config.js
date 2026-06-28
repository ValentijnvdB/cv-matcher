/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        primary: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a5b8fc',
          400: '#8193f8',
          500: '#6470f1',
          600: '#4f52e5',
          700: '#4040ca',
          800: '#3535a3',
          900: '#2f3181',
        },
        // Match category colors
        match: {
          excellent: '#166534', // dark green
          good:      '#16a34a', // green
          fair:      '#fce702', // orange
          none:      '#18181b', // near-black
        },
        // Score colors
        score: {
          high:   '#166534', // 1 (present)
          mid:    '#fce702', // 0 (partial)
          low:    '#dc2626', // -1 (absent)
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#000000",
          card: "#09090b",
          elevated: "#121214",
          surface: "#18181b",
          border: "#27272a",
          borderSubtle: "#1c1c1f",
          muted: "#71717a",
          text: "#f4f4f5",
          highlight: "#e4e4e7"
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}


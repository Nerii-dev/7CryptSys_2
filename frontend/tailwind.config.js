/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Diz ao Tailwind para procurar classes
    // em todos os seus arquivos de frontend
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
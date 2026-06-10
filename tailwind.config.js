/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bgDark: '#0B0F19',
          cardDark: '#161F30',
          accentGreen: '#10B981',
          accentBlue: '#3B82F6',
          borderDark: '#232E42',
        }
      }
    },
  },
  plugins: [],
}

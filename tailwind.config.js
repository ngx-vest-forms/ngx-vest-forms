/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./projects/examples/src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#0CC', // Replace with your color code
          600: '#2CC', // Replace with your color code
        },
      },
    },
  },
  variants: {
    extend: {
      ringColor: ['focus'],
      borderColor: ['focus'],
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

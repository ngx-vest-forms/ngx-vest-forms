const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./projects/examples/src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: colors.teal,
      },
    },
  },
  variants: {
    extend: {
      ringColor: ['focus'],
      borderColor: ['focus'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

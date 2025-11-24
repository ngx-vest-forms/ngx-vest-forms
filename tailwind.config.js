/**
 * Legacy Tailwind CSS v3 configuration file
 *
 * This file is no longer used in Tailwind CSS v4.
 * Configuration has been migrated to CSS @theme blocks in:
 * - projects/examples/src/styles.scss
 * - projects/ngx-vest-forms/.storybook/styles.scss
 *
 * Kept for reference only. Can be safely deleted.
 */

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

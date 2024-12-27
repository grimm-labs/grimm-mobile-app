const colors = require('./src/ui/colors');
import { platformSelect } from 'nativewind/theme';

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        roboto: ['Roboto'],
        system: platformSelect({
          ios: 'Roboto',
          android: 'sans-serif',
          default: 'Roboto',
        }),
      },
      colors,
    },
  },
  plugins: [],
};

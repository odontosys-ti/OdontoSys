import tailwindcss from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('autoprefixer')],
} satisfies tailwindcss.Config;

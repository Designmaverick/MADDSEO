import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#9a28c5'
      },
      boxShadow: {
        soft: '0 10px 30px -18px rgba(0,0,0,0.4)'
      }
    }
  },
  plugins: []
};

export default config;

import colors from 'tailwindcss/colors'
import fb from 'flowbite/plugin'

export default {
  cpurge: ['./*.html', './src/**/*.{vue,js,ts,jsx,tsx,css}'],
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",  //flowbyte stuff
  ],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    fontFamily:{
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    colors
  },
  plugins: [
    fb({
      charts: true,
      forms: true,
      tooltips: true,
    }),
  ]
}

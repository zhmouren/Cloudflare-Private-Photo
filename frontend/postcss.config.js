// frontend/postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- 更改了这一行
    autoprefixer: {},
  },
};
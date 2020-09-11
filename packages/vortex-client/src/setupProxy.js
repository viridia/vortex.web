// Set up proxy for running in local development.
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.SERVER_URL,
      changeOrigin: true,
    })
  );
};

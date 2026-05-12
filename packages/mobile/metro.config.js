const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Completely disable devtools to prevent websocket errors
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Block all devtools-related requests
      if (
        req.url.includes('/devtools') ||
        req.url.includes('/debugger-ui') ||
        req.url.includes('/launch-js-devtools')
      ) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('OK');
        return;
      }
      return middleware(req, res, next);
    };
  },
};

// Disable unstable features
config.transformer = {
  ...config.transformer,
  unstable_disableES6Transforms: false,
};

module.exports = config;
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        http: false,
        https: false,
        http2: false,
        util: false,
        zlib: false,
        stream: false,
        url: false,
        crypto: false,
        assert: false,
      };
      return webpackConfig;
    },
  },
};

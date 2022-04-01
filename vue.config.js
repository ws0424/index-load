const CompressionPlugin = require("compression-webpack-plugin");
const zlib = require("zlib");

module.exports = {
  publicPath: "./",
  outputDir: "dist",
  assetsDir: "static",
  indexPath: "index.html",
  configureWebpack: {
    performance: {
      hints: "warning", // 枚举
      maxAssetSize: 2000000, // 整数类型（以字节为单位）
      maxEntrypointSize: 4000000, // 整数类型（以字节为单位）
      assetFilter: function (assetFilename) {
        // 提供资源文件名的断言函数
        return assetFilename.endsWith(".css") || assetFilename.endsWith(".js");
      },
    },
  },

  chainWebpack(config) {
    if (process.env.NODE_ENV === "production") {
      // 对小图片进行处理减少请求次数
      config.module
        .rule("images")
        .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
        .use("image-webpack-loader")
        .loader("image-webpack-loader")
        .options({bypassOnDebug: true})
        .end();
      // 对文件进行切片分块
      config.optimization.splitChunks({
        chunks: "all",
        minSize: 2000000,
        maxSize: 4000000,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        automaticNameDelimiter: "~",
        name: true,
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: "com",
            chunks: "all",
            priority: -10,
          },
          default: {
            minChunks: 2,
            priority: -20,
            name: "def",
            reuseExistingChunk: true,
          },
        },
      });

      // 开启gizp
      config.plugin("compression-webpack-plugin").use(
        new CompressionPlugin({
          filename: "[path][base].gz",
          algorithm: "gzip",
          test: /\.js$|\.css$|\.html$/,
          threshold: 10240,
          minRatio: 0.8,
        })
      );

      config.plugin("compression-webpack-plugin").use(
        new CompressionPlugin({
          filename: "[path][base].br",
          algorithm: "brotliCompress",
          test: /\.(js|css|html|svg)$/,
          compressionOptions: {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
            },
          },
          threshold: 10240,
          minRatio: 0.8,
        })
      );

      config.optimization.runtimeChunk({
        name: (entrypoint) => `runtimechunk~${entrypoint.name}`,
      });
    }
  },
};

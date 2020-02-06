const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  devtool: slsw.lib.webpack.isLocal ? 'eval-source-map' : 'nosources-source-map',
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  performance: {
    hints: false
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: __dirname,
        exclude: /node_modules/
      }
    ]
  }
};

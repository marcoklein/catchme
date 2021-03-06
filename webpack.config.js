const path = require('path');

module.exports = {
  entry: './src/client/index.ts',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader?{configFileName: "tsconfig-client.json"}',
        exclude: /node_modules/
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'catchmeclient.js',
    path: path.resolve(__dirname, 'public/built')
  },
  externals: {
    'phaser': 'Phaser',
    'io': 'SocketIOClient'
  }
};

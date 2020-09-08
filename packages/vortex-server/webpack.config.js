const path = require('path');

const config = {
  mode: 'production',
  entry: {
    handler: path.resolve(__dirname, 'src/lambda.ts'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: ['aws-sdk'],
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd',
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};

module.exports = config;

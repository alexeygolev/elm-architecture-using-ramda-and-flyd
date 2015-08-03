var path = require('path');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');

new WebpackDevServer(webpack(config), {
  contentBase: path.resolve(__dirname),
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: {
    index: 'index.html'
  }
}).listen(3000, 'localhost', function (err, result) {
    if (err) {
      console.log(err);
    }

    console.log('Listening at localhost:3000');
  });

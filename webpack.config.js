var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'src/client/public');
var APP_DIR = path.resolve(__dirname, 'src/client');

var config = {
  entry: {
    userpage: APP_DIR + '/index.jsx',
    streampage: APP_DIR + '/stream_list.jsx',
    adminpanel: APP_DIR + '/admin_panel_supernovamaniac.jsx',
    unlock_panel: APP_DIR + '/unlock_panel.jsx'
  },
  output: {
    path: BUILD_DIR,
    filename: '[name].bundle.js',
    publicPath: BUILD_DIR
  },
  module : {
    loaders : [
      {
        test : /\.jsx?/,
        include : APP_DIR,
        loader : 'babel-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  }
};

module.exports = config;

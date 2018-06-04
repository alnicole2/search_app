const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const TranslationsPlugin = require('./webpack/translations-plugin')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env) => {
  // const getEnvConfig = (dev, prod) => {
  //   switch (process.env.NODE_ENV){
  //     case 'development': return dev || {}
  //     case 'production': return prod || {}
  //     default: return {}
  //   }
  // }

  return {
    entry: {
      app: [
        'babel-polyfill',
        './src/javascript/main.js',
        './src/main.css'
      ]
    },

    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist/assets')
    },

    // list of which loaders to use for which files
    module: {
      rules: [
        {
          test: /\.js$/,
          use: { loader: 'babel-loader', options: { presets: ['babel-preset-env'] } }
        },
        {
          test: /\.json$/,
          exclude: path.resolve(__dirname, './src/translations'),
          use: 'json-loader'
        },
        {
          test: /\.json$/,
          include: path.resolve(__dirname, './src/translations'),
          use: './webpack/translations-loader'
        },
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            use: ['css-loader', 'postcss-loader']
          })
        },
        {
          test: /\.(gif|jpe?g|png|svg|woff2?|ttf|eot)$/,
          use: { loader: 'url-loader', options: { limit: 10000 } }
        }
      ]
    },

    plugins: [
      // Empties the dist folder
      new CleanWebpackPlugin(['dist/*']),

      // Copy over some files
      new CopyWebpackPlugin([
        { from: 'src/manifest.json', to: '../', flatten: true },
        { from: 'src/images/dot.gif', to: '.', flatten: true },
        { from: 'src/images/logo.png', to: '.', flatten: true },
        { from: 'src/images/logo-small.png', to: '.', flatten: true },
        { from: 'src/images/screenshot*', to: '.', flatten: true },
        { from: 'src/templates/iframe.html', to: '.', flatten: true }
      ]),

      new TranslationsPlugin({
        path: path.resolve(__dirname, './src/translations')
      }),

      // Take the css and put it in styles.css
      new ExtractTextPlugin('styles.css')

      // new BundleAnalyzerPlugin()
    ]
  }
}

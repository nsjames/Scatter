const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = {
    entry: {
        'background.js': path.resolve(__dirname, './src/background.js'),
        'popup.js': path.resolve(__dirname, './src/popup.js'),
        'content.js': path.resolve(__dirname, './src/content.js'),
        'inject.js': path.resolve(__dirname, './src/inject.js'),
        'styles.css': path.resolve(__dirname, './src/sass/styles.scss'),
        'index.omit': path.resolve(__dirname, './src/index.html'),
        'icon.omit': path.resolve(__dirname, './src/icon.png'),

        // TODO There's a problem with this, make sure manifest.json is in /build/ dir manually
        'manifest.omit': path.resolve(__dirname, './src/manifest.json'),
    },
    output: {
        path: path.resolve(__dirname, './build'),
        filename: '[name]'
    },
    resolve: {
        alias: { vue: 'vue/dist/vue.js', scatterdapp: path.join(__dirname, "node_modules/scatterdapp") },
        modules: [ path.join(__dirname, "node_modules") ]
    },
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel-loader', query: { presets: ['es2015'] },exclude: /node_modules/ }
        ],
        rules:[
            { test: /\.(sass|scss)$/, loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader']) },
            { test: /\.(html|png)$/, loader: 'file-loader', options: { name: '[name].[ext]' } },
            { test: /\.vue$/, loader: 'vue-loader', options: { loaders: { js: 'babel-loader' } } }
        ]
    },
    plugins: [
        new ExtractTextPlugin({ filename: '[name]', allChunks: true, }),
        new IgnoreEmitPlugin(/\.omit$/),
        new ZipPlugin({ path: '../', filename: 'scatter.zip', })
    ],
    stats: { colors: true },
    devtool: 'source-map'
}
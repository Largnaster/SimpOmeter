const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// Defines where the bundle file will live
const bundlePath = path.resolve(__dirname, "dist/");

module.exports = (_env, argv) => {
  let entryPoints = {
    Panel: {
      path: "./src/Panel.js",
      outputHtml: "panel.html",
      build: true,
    },
    Config: {
      path: "./src/Config.js",
      outputHtml: "config.html",
      build: true,
    },
  };

  let entry = {};

  // Edit webpack plugins here
  let plugins = [new webpack.HotModuleReplacementPlugin()];

  for (name in entryPoints) {
    if (entryPoints[name].build) {
      entry[name] = entryPoints[name].path;
      if (argv.mode === "production") {
        plugins.push(
          new HtmlWebpackPlugin({
            inject: true,
            chunks: [name],
            template: "./template.html",
            filename: entryPoints[name].outputHtml,
          })
        );
      }
    }
  }

  let config = {
    // entry points for webpack- remove if not used or needed
    entry,
    optimization: {
      minimize: false, // Neccessary to pass Twitch's review process
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /(node_modules|bower_components)/,
          loader: "babel-loader",
          options: { presets: ["@babel/env", "@babel/react"] },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          loader: "file-loader",
          options: {
            name: "img/[name].[ext]",
          },
        },
      ],
    },
    resolve: {
      extensions: ["*", ".js", ".jsx"],
      fallback: {
        "buffer": false,
        "crypto": false,
        "util": false,
        "stream": false
      },
    },
    output: {
      filename: "[name].bundle.js",
      path: bundlePath,
    },
    plugins,
  };
  if (argv.mode === "development") {
    config.devServer = {
      contentBase: path.join(__dirname, "public"),
      host: argv.devrig ? "localhost.rig.twitch.tv" : "localhost",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      port: 8080,
    };
    if (fs.existsSync(path.resolve(__dirname, "conf/server.key"))) {
      config.devServer.https = {
        key: fs.readFileSync(path.resolve(__dirname, "conf/server.key")),
        cert: fs.readFileSync(path.resolve(__dirname, "conf/server.crt")),
      };
    }
  }

  return config;
};

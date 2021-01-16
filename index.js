const HtmlWebpackPlugin = require('html-webpack-plugin')

// Set the components that will be used
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
  Mobile: {
    path: "./src/Mobile.js",
    outputHtml: "mobile.html",
    build: true,
  }
};

let entry = {};
let output = [];
for (name in entryPoints) {
  if (entryPoints[name].build) {
    entry[name] = entryPoints[name].path;
    output.push(
      new HtmlWebpackPlugin({
        inject: true,
        chunks: name,
        template: "./template.html",
        filename: entryPoints[name].outputHtml,
      })
    );
  }
}

console.log(entry);
console.log(output);

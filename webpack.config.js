const webpack = require("webpack");
const path = require("path");

const DESTINATION = path.resolve(__dirname, 'dist')

module.exports = {
	mode: "production",
	// mode: "development",

	entry: {
		main: "./src/index.ts",
	},
	output: {
		path: DESTINATION,
		filename: "keplerlit.js",
		publicPath: "/dist/",
		// Configure the output as a library
		library: {
			name: 'keplerlit',
			type: 'umd'
		},
		globalObject: 'this'
	},
	resolve: {
		extensions: [".webpack.js", ".ts", ".tsx", ".js"]
	},
	module: {
		rules: [
			{
				test: /\.(glsl|vs|fs)$/,
				loader: "ts-shader-loader"
			},
			{
				test: /\.tsx?$/,
				exclude: [/node_modules/, /tsOld/],
				loader: "ts-loader"
			}
		]
	},
	devServer: {
		static: path.join(__dirname, '/'),
		port: 8000,
		host: "0.0.0.0",
	}
}
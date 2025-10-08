const path = require("path");

const DESTINATION = path.resolve(__dirname, 'dist')

const baseConfig = {
	entry: "./src/index.ts",
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
	}
};

// UMD build (for script tags)
const umdConfig = {
	...baseConfig,
	mode: "production",
	output: {
		path: DESTINATION,
		filename: "keplerlit.js",
		library: {
			name: 'keplerlit',
			type: 'umd'
		},
		globalObject: 'this'
	}
};

// ES Module build (for import statements)
const moduleConfig = {
	...baseConfig,
	mode: "production",
	output: {
		path: DESTINATION,
		filename: "keplerlit.module.js",
		library: {
			type: 'module'
		},
		environment: {
			module: true
		}
	},
	experiments: {
		outputModule: true
	}
};

module.exports = [umdConfig, moduleConfig];
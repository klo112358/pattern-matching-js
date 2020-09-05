import typescript from "@rollup/plugin-typescript"
import babel from "@rollup/plugin-babel"
import { terser } from "rollup-plugin-terser"

export default [{
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "cjs",
    sourcemap: true,
    exports: "named",
  },
  plugins: [
    typescript({
      outDir: "dist",
      rootDir: "src",
      exclude: "test/**",
      declaration: true,
      declarationMap: true,
    }),
    babel({
      babelHelpers: "bundled",
      extensions: [".js", ".ts"],
      presets: [
        ["@babel/preset-env", {
          useBuiltIns: false,
        }],
      ],
    }),
  ],
},
{
  input: "src/index.ts",
  output: {
    file: "umd/pattern-matching.js",
    name: "Pattern",
    format: "umd",
    exports: "named",
    sourcemap: true,
  },
  plugins: [
    typescript({
      rootDir: "src",
      exclude: "test/**",
      declaration: false,
      declarationMap: false,
    }),
    babel({
      babelHelpers: "bundled",
      extensions: [".js", ".ts"],
      presets: [
        ["@babel/preset-env", {
          useBuiltIns: false,
        }],
      ],
    }),
  ],
},
{
  input: "src/index.ts",
  output: {
    file: "umd/pattern-matching.min.js",
    name: "Pattern",
    format: "umd",
    exports: "named",
    sourcemap: true,
  },
  plugins: [
    typescript({
      rootDir: "src",
      exclude: "test/**",
      declaration: false,
      declarationMap: false,
    }),
    babel({
      babelHelpers: "bundled",
      extensions: [".js", ".ts"],
      presets: [
        ["@babel/preset-env", {
          useBuiltIns: false,
        }],
      ],
    }),
    terser(),
  ],
}]

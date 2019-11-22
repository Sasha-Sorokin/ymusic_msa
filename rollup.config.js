import nodeResolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import commonJS from "rollup-plugin-commonjs";
import yaml from "rollup-plugin-yaml";
import replace from "@rollup/plugin-replace";
import license from "rollup-plugin-license";
import pkg from "./package.json";
import path from "path";

export default {
    input: "src/index.ts",
    output: [{
        file: pkg.main,
        format: "iife",
    }],
    external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
    ],

    plugins: [
        nodeResolve({
            browser: true,
        }),
        typescript({
            typescript: require("typescript"),
        }),
        commonJS(),
        yaml(),
        replace({
            values: {
                "__currentVersion__": `${pkg.version}--${Date.now()}`,
                "__changeLogLink__": `${pkg.homepage}/blob/master/CHANGELOG.md`,
            },
        }),
        license({
            banner: {
                commentStyle: "slash",
                content: {
                    file: path.join(__dirname, "metadata.txt"),
                    encoding: "utf8",
                },
            },
        }),
    ],

    experimentalTopLevelAwait: true,
    experimentalOptimizeChunks: true,

    external: {
        "throttleit": "throttle",
    },
}

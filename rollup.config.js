import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import svg from "rollup-plugin-svg";

const pkg = require('./package.json');

export default {
    input: [
        'src/index.js'
    ],
    output: [
        {file: pkg.module, format: 'es', name: 'SvelteGenericCrudTable'},
        {file: pkg.main, format: 'iife', name: 'SvelteGenericCrudTable'},
    ],
    plugins: [
        svelte({
            customElement: true,
            tag: null,
            css: css => {
                css.write('dist/build/bundle.css');
            }
        }),
        resolve({
                extensions: ['.svelte', '.mjs', '.js', '.jsx', '.json'],
                mainFields: ['jsnext:main', 'module', 'main']
            }
        ),
        svg()
    ]
};

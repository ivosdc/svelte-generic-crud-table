import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';

const pkg = require('./package.json');

export default {
    input: [
        'src/index.js'
    ],
    output: [
        {file: pkg.module, format: 'iife', name: 'SvelteGenericCrudTable'},
        {file: pkg.main, format: 'iife', name: 'SvelteGenericCrudTable'},
    ],
    plugins: [
        svelte({
            customElement: true,
            tag: null,
            emitCss: true,
            css: (css) => {
                css.write('dist/build/crud-table.css');
            }
        }),
        resolve({
                extensions: ['.svelte', '.mjs', '.js', '.jsx', '.json'],
                mainFields: ['jsnext:main', 'module', 'main']
            }
        )
    ]
};

import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';

const pkg = require('./package.json');

export default {
    input: [
        'src/index.js'
    ],
    output: [
        {file: pkg.module, format: 'es', name: 'SvelteGenericCrudTable'},
        {file: pkg.main, format: 'umd', name: 'SvelteGenericCrudTable'},
    ],
    plugins: [
        svelte({
            customElement: true,
            tag: "crud-table",
            emitCss: true
        }),
        resolve({
                extensions: ['.svelte', '.mjs', '.js', '.jsx', '.json'],
                mainFields: ['jsnext:main', 'module', 'main']
            }
        )
    ]
};

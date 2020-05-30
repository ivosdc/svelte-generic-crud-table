import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';

const pkg = require('./package.json');

export default {
    input: 'src/SvelteGenericCrudTable.svelte',
    output: [
        {file: pkg.module, format: 'umd', name: 'GenericCrudTable'},
        {file: pkg.main, format: 'umd', name: 'GenericCrudTable'},
    ],
    plugins: [
        svelte({
            customElement: true
        }),
        resolve()
    ],
};

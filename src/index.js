import SvelteGenericCrudTable from './SvelteGenericCrudTable.svelte';

const generictable = new SvelteGenericCrudTable({
    target: document.body,
    props: {
        name : '',
        show_fields: [],
        editable_fields: [],
        table: [],
        options: [],
    }
});

export {generictable as SvelteGenericCrudTable};

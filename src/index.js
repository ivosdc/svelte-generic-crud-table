import SvelteGenericCrudTable from './SvelteGenericCrudTable.svelte';

const genericTable = new SvelteGenericCrudTable({
    target: document.body,
    props: {
        name : '',
        show_fields: [],
        editable_fields: [],
        table: [],
        options: [],
    },
});

export default genericTable;

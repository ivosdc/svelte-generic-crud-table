# svelte-generic-crud-table
- Web-component: `<crud-table></crud-table>`
- or Svelte-component: `import SvelteGenericCrudTable from 'svelte-generic-crud-table'`

A self-containing sortable table component with inline edit option.
See `<table-pager>` with integrated paginator for pagination.
[table-pager](https://www.npmjs.com/package/svelte-generic-table-pager/ "CrudTable with paginator Example")

Allows CRUD-operations for Object-Arrays.

[Try out live example:](https://ivosdc.github.io/svelte-generic-crud-table/ "GeneralCrudTable Example")

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/svelte-generic-crud-table)


## Install

```
npm install svelte-generic-crud-table
```


### State (master):
[![Build Status](https://travis-ci.com/ivosdc/svelte-generic-crud-table.svg?branch=master)](https://travis-ci.com/ivosdc/svelte-generic-crud-table)
[![Coverage Status](https://coveralls.io/repos/github/ivosdc/svelte-generic-crud-table/badge.svg?branch=master)](https://coveralls.io/github/ivosdc/svelte-generic-crud-table?branch=master)

# Usage
Use the svelte-generic-crud-table in your component to show and, if you like, edit,update and delete it's content.
Just include the table as seen in the example below.


### `<crud-table></crud-table>`
```
<custom-element-demo>
<template>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width,initial-scale=1'>
    <title>Generic Crud Table</title>
    <link rel='icon' type='image/png' href='favicon.png'>
    <link rel='stylesheet' href='https://ivosdc.github.io/svelte-generic-crud-table/global.css'>
    <link rel='stylesheet' href='https://ivosdc.github.io/svelte-generic-crud-table/build/crud-table.css'>
    <script defer src='https://ivosdc.github.io/svelte-generic-crud-table/build/crud-table.js'></script>
</head>

<body>
<hr>
<crud-table></crud-table>
<hr>
</body>
<script src='https://ivosdc.github.io/svelte-generic-crud-table/test-data.js'></script>
<script src='https://ivosdc.github.io/svelte-generic-crud-table/crud-table-config-html.js'></script>
</template>
</custom-element-demo>
```

```html
<crud-table></crud-table>
```

###  Svelte-Component - implementation example:
```
    import SvelteGenericCrudTable from "svelte-generic-crud-table";
    import GenericTablePager from "svelte-generic-table-pager";
    import {onMount} from 'svelte';
    import {goto} from "@sapper/app";

    const sortStore = [];

    let myData = [];

    onMount(refresh);

    function refresh() {
        get().then( (result) => {
                myData = result;
        }).catch((error) => {
        }).finally(() =>{
            initComponent();
        });
    }

    function initComponent() {
        let elem = document.getElementById('right');
        elem.click();
    }

    function handleCreate(event) {
        post({name: "new entry"})
                .then(() => {
                    refresh();
                });
    }


    function handleDelete(event) {
        delete(event.detail.body.id)
                .then(() => {
                    refresh();
                });
    }

    function handleUpdate(event) {
        update(event.detail.body.id, event.detail.body)
                .then(() => {
                    refresh();
                });
    }

    function handleDetail(event) {
        goto('/project/' + event.detail.body.id);
    }

    function handleSort(event) {
        const column = event.detail.column;
        if (sortStore[column] === undefined || sortStore[column] === 'DESC') {
            sortStore[column] = 'ASC';
        } else {
            sortStore[column] = 'DESC';
        }

        const tableSort = (a, b) => {
            var keyA = a[column];
            var keyB = b[column];
            if (sortStore[column] === 'ASC') {
                if (keyA < keyB) return -1;
                if (keyA > keyB) return 1;
            } else {
                if (keyA < keyB) return 1;
                if (keyA > keyB) return -1;
            }
            return 0;
        };

        myData = myData.sort(tableSort);
    }

    const table_config = {
        name: 'Awesome',
        options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
        columns_setting: [
            {name: 'id', show: false, edit: true, width: '200px'},
            {name: 'job', show: true, edit: true, width: '100px'},
            {name: 'name', show: true, edit: true, width: '200px'},
            {name: 'private', show: true, edit: false, width: '200px'}
        ]
    }


    // GenericTablePager
    let page_data = [];
    let pager_data;
    $: pager_data = myData;

    let pager_config = {
        name: 'crud-table-pager',
        lines: 5,
        steps: [1, 2, 5, 10, 20, 50],
        width: '320px'
    };

    function handleNewPage(event) {
        page_data = event.detail.body;
    }

</script>

<main>
    <SvelteGenericCrudTable on:delete={handleDelete}
                            on:update={handleUpdate}
                            on:create={handleCreate}
                            on:details={handleDetail}
                            on:sort={handleSort}
                            table_config={table_config}
                            table_data={page_data}/>
    <GenericTablePager on:newpage={handleNewPage}
                       pager_data={pager_data}
                       pager_config={pager_config}></GenericTablePager>
</main>

```
[![Donate](https://github.com/ivosdc/svelte-generic-crud-table/raw/master/assets/donate.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=7V5M288MUT7GE&source=url)


# svelte-generic-crud-table
- Web-component: `<crud-table></crud-table>`
- or Svelte-component: `import SvelteGenericCrudTable from 'svelte-generic-crud-table'`

A self-containing sortable table component with inline edit option.
The example uses `<table-pager>` for pagination.

Allows CRUD-operations for Object-Arrays.

[Try out live example:](https://ivosdc.github.io/svelte-generic-crud-table/ "GeneralCrudTable Example")

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/svelte-generic-crud-table)


## Install

```
npm install -save svelte-generic-crud-table
```

For pagination e.g.:
```
npm install -save svelte-generic-table-pager
```

[![Donate](https://github.com/ivosdc/svelte-generic-crud-table/raw/master/assets/donate.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=7V5M288MUT7GE&source=url)

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
    <link rel='stylesheet' href='https://ivosdc.github.io/svelte-generic-table-pager/build/table-pager.css'>
    <script defer src='https://ivosdc.github.io/svelte-generic-table-pager/build/table-pager.js'></script>
    <link rel='stylesheet' href='https://ivosdc.github.io/svelte-generic-crud-table/global.css'>
    <link rel='stylesheet' href='https://ivosdc.github.io/svelte-generic-crud-table/build/crud-table.css'>
    <script defer src='https://ivosdc.github.io/svelte-generic-crud-table/build/crud-table.js'></script>
</head>

<body>
<hr>
<crud-table></crud-table>
<table-pager></table-pager>
<hr>
</body>
<script src='https://ivosdc.github.io/svelte-generic-crud-table/test-data.js'></script>
<script src='https://ivosdc.github.io/svelte-generic-crud-table/table-pager-config-html.js'></script>
<script src='https://ivosdc.github.io/svelte-generic-crud-table/crud-table-config-html.js'></script>
</template>
</custom-element-demo>
```

```html
<crud-table></crud-table>
<table-pager></table-pager>
```

###  Svelte-Component:
```
<script>
    import SvelteGenericCrudTable from "svelte-generic-crud-table";

    function handleDelete(event) {
    }

    function handleUpdate(event) {
    }

    function handleCreate(event) {
    }

    function handleDetails(event) {
    }

    function handleSort(event) {
    }

    // example object array. This should be your db query result.
    let myObjectArray = [
        {id: 1, name: "A_NAME_1", sthg: "A_STHG_1", why: "because"},
        {id: 2, name: "A_NAME_2", sthg: "A_STHG_2", why: "I can"}
    ]


   // GenericTablePager
    let page_data = [];

    function handleNewPage(event) {
        page_data = event.detail.body;
    }

</script>

<main>
    <SvelteGenericCrudTable on:delete={handleDelete}
                            on:update={handleUpdate}
                            on:create={handleCreate}
                            on:details={handleDetails}
                            on:sort={handleSort}
                            table_config={{
                                name: 'Awesome:',
                                options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
                                columns_setting: [
                                    {name: 'id', show: false, edit: true, width: '200px'},
                                    {name: 'name', show: true, edit: true, width: '200px'},
                                    {name: 'why', show: true, edit: true, width: '200px'},
                                    {name: 'sthg', show: true, edit: false, width: '200px'}
                                ]
                            }}
                            table_data={page_data}></SvelteGenericCrudTable>

    <GenericTablePager on:newpage={handleNewPage}
                       pager_data={myObjectArray}
                       pager_config={{
                                        lines: 5
                                    }}></GenericTablePager>
</main>

```

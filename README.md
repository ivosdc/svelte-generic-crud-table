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

<script>

    // config table-pager
    let table_data = [];
    let myData = [
        {id: '127', name: 'myName', job: 'why', private: 'not editable'},
        {id: '128', name: 'myRealName', job: 'hmm', private: 'personal info'},
        {id: '129', name: 'Your Name', job: 'no', private: '122/456789'},
        {id: '130', name: 'Jim', job: 'code', private: 'sthg@here.where'},
        {id: '131', name: 'John', job: 'tester', private: 'books'},
        {id: '132', name: 'Alice', job: 'code', private: 'OSS'},
        {id: '133', name: 'Nicole', job: 'design', private: 'painting'},
        {id: '134', name: 'Denis', job: 'coder', private: 'sports'},
        {id: '135', name: 'Marc', job: 'trainer', private: 'rc models'},
        {id: '136', name: 'Timme', job: 'diverse', private: 'timme'},
        {id: '137', name: 'Chuck', job: 'hero', private: 'Norris'}
    ];

    const pager_config = {
        lines: 5
    }

    let currentPage = 1;
    let maxPages = 1;
    let genericTablePager = document.querySelector('table-pager');
    genericTablePager.setAttribute('pager_config', JSON.stringify(pager_config))
    genericTablePager.setAttribute('pager_data', JSON.stringify(myData))


    genericTablePager.addEventListener('newpage', (e) => {
        console.log(e)
        table_data = e.detail.body;
        currentPage = e.detail.page;
        maxPages = e.detail.pages;
        refresh();
    });


    function refresh_pager() {
        genericTablePager.setAttribute('pager_data', JSON.stringify(myData));
        if (currentPage > 1) {
            genericTablePager.shadowRoot.getElementById('left').click();
            genericTablePager.shadowRoot.getElementById('right').click();
        } else {
            genericTablePager.shadowRoot.getElementById('right').click();
            genericTablePager.shadowRoot.getElementById('left').click();
        }
    }


    //config crud-table
    let table_config = {
        name: 'Awesome',
        options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
        columns_setting: [
            {name: 'id', show: false, edit: true, size: '200px'},
            {name: 'job', show: true, edit: true, size: '200px'},
            {name: 'name', show: true, edit: true, size: '200px'},
            {name: 'private', show: true, edit: false, size: '200px'}
        ]
    }

    let genericCrudTable = document.querySelector('crud-table');
    const sortStore = [];

    genericCrudTable.setAttribute('table_config', JSON.stringify(table_config));
    genericCrudTable.setAttribute('table_data', JSON.stringify(table_data));

    genericCrudTable.addEventListener('create', () => {
        console.log('create');
        myData.push({name: 'myName', job: 'code', private: 'not editable'});
        refresh();
        refresh_pager();
    });

    genericCrudTable.addEventListener('details', (e) => {
        console.log('details');
        console.log(e.detail.body);
    });

    genericCrudTable.addEventListener('update', (e) => {
        console.log('update');
        console.log(e.detail.body);
        let BreakException = {};
        for(let i = 0; i < myData.length; i++) {
            if (JSON.stringify(myData[i]) === JSON.stringify(table_data[e.detail.id])) {
                myData[i] = e.detail.body;
                break;
            }
        }
        refresh();
        refresh_pager();
    });

    genericCrudTable.addEventListener('delete', (e) => {
        console.log('delete: ' + JSON.stringify(e.detail.body));
        console.log('offset in view:' + e.detail.id);
        for(let i = 0; i < myData.length; i++) {
            if (JSON.stringify(myData[i]) === JSON.stringify(table_data[e.detail.id])) {
                myData = arrayRemove(myData, i)
                break;
            }
        }
        refresh();
        refresh_pager();
    });

    genericCrudTable.addEventListener('sort', (e) => {
        console.log('sort: ' + e.detail.column);
        const column = e.detail.column;
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

        table_data = table_data.sort(tableSort);
        refresh();
    });

    function refresh() {
        genericCrudTable.setAttribute('table_data', JSON.stringify({}));
        genericCrudTable.setAttribute('table_data', JSON.stringify(table_data));
    }

    function arrayRemove(arr, value) {
        return arr.filter(function (ele, i) {
            return i !== value;
        });
    }
</script>
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
                                    {name: 'id', show: false, edit: true, size: '200px'},
                                    {name: 'name', show: true, edit: true, size: '200px'},
                                    {name: 'why', show: true, edit: true, size: '200px'},
                                    {name: 'sthg', show: true, edit: false, size: '200px'}
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

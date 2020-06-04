# svelte-generic-crud-table
Use as:
- Web-component: `<crud-table></crud-table>`
- or Svelte-component: `import SvelteGenericCrudTable from 'svelte-generic-crud-table'`

See examples below...


[![Build Status](https://travis-ci.com/ivosdc/svelte-generic-crud-table.svg?branch=master)](https://travis-ci.com/ivosdc/svelte-generic-crud-table)


A self-containing sortable table component with inline edit option.

Allows CRUD-operations for Object-Arrays.

[Try as web-component on github pages:](https://ivosdc.github.io/svelte-generic-crud-table/ "GeneralCrudTable Example")

![Generic CRUD Table](https://github.com/ivosdc/svelte-generic-crud-table/raw/master/assets/generic-crud-table.png "Svelte GenericCrudTable")

## Install

```
npm install -save svelte-generic-crud-table
```

# Usage
Use the svelte-generic-crud-table in your component to show and, if you like, edit,update and delete it's content.
Just include the table as seen in the example below.


###  Set options - Svelte-Component:
```
<script>
    import SvelteGenericCrudTable from "svelte-generic-crud-table";

    function handleDelete(event) {
        const id = event.detail.id; // position in myObjectArray
        const body = event.detail.body; // object to delete
        console.log(JSON.stringify(event.detail.body));
        myObjectArray.slice(id,1);
    }

    function handleUpdate(event) {
        const id = event.detail.id; // position in table
        const body = event.detail.body;
        console.log(JSON.stringify(body));
        myObjectArray[id] = body;
    }

    function handleCreate(event) {
        console.log(JSON.stringify(event.detail)); // empty object is passed by now
        myObjectArray.push({id: -1, name:'new Element', sthg:'2345', why:'1234'})
        myObjectArray = myObjectArray;
    }

    function handleDetails(event) {
        const id = event.detail.id; // position in table
        const body = event.detail.body;
        console.log(JSON.stringify(body));
    }

    function handleSort(event) {
        console.log('sort: ' + e.detail.column);
    }

    // example object array. This should be your db query result.
    const myObjectArray = [
        {id: 1, name: "A_NAME_1", sthg: "A_STHG_1", why: "because"},
        {id: 2, name: "A_NAME_2", sthg: "A_STHG_2", why: "I can"}
    ]
</script>

<main>
    <SvelteGenericCrudTable on:delete={handleDelete}
                            on:update={handleUpdate}
                            on:create={handleCreate}
                            on:details={handleDetails}
                            on:sort={handleSort}
                              table_config={{
                                name: 'Awesome',
                                options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
                                columns_setting: [
                                // columns order is relevant
                                    {name: 'id', show: false, edit: true, size: '200px'},
                                    {name: 'name', show: true, edit: true, size: '200px'},
                                    {name: 'why', show: true, edit: true, size: '200px'},
                                    {name: 'sthg', show: true, edit: false, size: '200px'}
                                ]
                            }}
                            table_data={JSON.stringify(myObjectArray)}></SvelteGenericCrudTable>
</main>
```


### As Web-Component `<crud-table></crud-table>`
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width,initial-scale=1'>
    <title>Generic Crud Table</title>
    <link rel='icon' type='image/png' href='favicon.png'>
    <link rel='stylesheet' href='global.css'>
    <link rel='stylesheet' href='build/crud-table.css'>
    <script defer src='build/crud-table.js'></script>
</head>

<body>
<h1>&lt;crud-table&gt;&lt;/crud-table&gt;</h1>
<p>Agnostic web-component for object-arrays with CRUD functionality.</p>
<span style="background-color: #dddddd; padding: 0.4em; display:inline-block">&gt; npm install -save svelte-generic-crud-table</span>
<p></p>
<hr>
<crud-table></crud-table>
<hr>
</span style="text-align: right"><a href="https://ivolution.one">ivolution.one product - MIT License</a></p>
</body>

<script>
    let table_data = [
        {name: 'myName', job: 'code', private: 'not editable'},
        {name: 'myName2', job: 'code2', private: 'not editable'}
        ];

    let table_config = {
        name: 'Awesome',
        options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
        columns_setting: [
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
        table_data.push({name: 'myName', job: 'code', private: 'not editable'});
        refresh();
    });

   genericCrudTable.addEventListener('details', (e) => {
        console.log('details');
        console.log(e.detail.body);
    });

    genericCrudTable.addEventListener('update', (e) => {
        console.log('update');
        console.log(e.detail.body);
        table_data[e.detail.id] = e.detail.body;
        refresh();
    });

    genericCrudTable.addEventListener('delete', (e) => {
        console.log('delete: ' + JSON.stringify(e.detail.body));
        console.log('offset in view:' + e.detail.id);
        table_data = arrayRemove(table_data, e.detail.id);
        refresh();
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
</html>

```



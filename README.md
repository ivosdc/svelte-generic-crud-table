# svelte-generic-crud-table
Use as:
- Web-component: `<crud-table></crud-table>`
- or Svelte-component: `import SvelteGenericCrudTable from 'svelte-generic-crud-table`

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

### Displays all data with no options:
```
    <SvelteGenericCrudTable table={myObjectArray}/>
```

All parameters are optional.


- dispatches UPDATE, DELETE, CREATE for individual object handling.
- dispatches DETAILS to handle Object detail handling.
- `name`: the individual table name. It's an identifier for the elements.
- `show_fields`: List of fields to display with its width. Type: `{fieldname: 'width'}`. If no fields are set all fields will be shown.
- `editable_fields`: List the 'editable' fields in your object. E.g. editing the id makes no sense in most cases, so it is not listed here.
- `options`: set the options for your table. Displays/hides button for `'CREATE', 'EDIT', 'DELETE', 'DETAILS'`.
- `table`: The object-array. Your data to show.


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

    // example object array. This should be your db query result.
    let myObjectArray = [
        {id: 1, name: "A_NAME", sthg: "A_STHG", why: 'because'},
        {id: 2, name: "ANOTHER_NAME", sthg: "ANOTHER_STHG", why: 'I can'},
        {id: 3, name: "svelte-generic-crud-table", sthg: "Awesome !", why: '!'}
    ]
    export let name;
</script>


<main>
    <h1>Generic CRUD Table</h1>
    <SvelteGenericCrudTable on:delete={handleDelete}
                            on:update={handleUpdate}
                            on:create={handleCreate}
                            on:details={handleDetails}
                            name="tableName"
                            show_fields={[
                                {name: '200px'},
                                {sthg: '20%'},
                                {why: '100px'}
                            ]}
                            editable_fields={['name', 'why']}
                            options={['CREATE', 'EDIT', 'DELETE', 'DETAILS']}
                            table={myObjectArray}/>
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
    <link rel='stylesheet' href='build/bundle.css'>
    <script defer src='build/bundle.js'></script>
</head>

<body>
<crud-table></crud-table>
</body>

<script>
    let table = [
        {name: 'myName', job: 'code', private: 'not editable'},
        {name: 'myName2', job: 'code2', private: 'not editable'}];
    let options = ['CREATE', 'EDIT', 'DELETE', 'DETAILS'];
    let name = 'Awesome';
    let show_fields = [{name: '200px'},{job: '200px'}];
    let editable_fields = ['name', 'job'];
    let genericCrudTable = document.querySelector('crud-table');
    genericCrudTable.setAttribute('name', name);
    genericCrudTable.setAttribute('show_fields', JSON.stringify(show_fields));
    genericCrudTable.setAttribute('editable_fields', JSON.stringify(editable_fields));
    genericCrudTable.setAttribute('options', JSON.stringify(options));
    genericCrudTable.setAttribute('table', JSON.stringify(table));

    genericCrudTable.addEventListener('create', () => {
        console.log('create');
        table.push({name: 'myName', job: 'code', private: 'not editable'});
        genericCrudTable.setAttribute('table', JSON.stringify(table));
    });
    genericCrudTable.addEventListener('details', (e) => {
        console.log('details');
        console.log(e.detail.body);
    });
    genericCrudTable.addEventListener('update', (e) => {
        console.log('update');
        console.log(e.detail.body);
        table[e.detail.id] = e.detail.body;
        genericCrudTable.setAttribute('table', JSON.stringify(table));
    });
    genericCrudTable.addEventListener('delete', (e) => {
        console.log('delete');
        console.log(e.detail.body);
        console.log(e.detail.id)
        table = arrayRemove(table, e.detail.id);
        genericCrudTable.setAttribute('table', JSON.stringify(table));
    });
    function arrayRemove(arr, value) { return arr.filter(function(ele, i){ return i != value; });}
</script>
</html>
```

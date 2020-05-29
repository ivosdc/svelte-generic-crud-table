# svelte-generic-crud-table

A self-containing sortable table component with inline edit option.

Allows CRUD-operations for Object-Arrays.

[Try out on github pages:](https://ivosdc.github.io/svelte-generic-crud-table/ "GeneralCrudTable Example")

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


###  Set options:
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

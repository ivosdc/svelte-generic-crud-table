# svelte-generic-crud-table

A self-containing svelte table component with inline edit option.

Allows CRUD-operations for Object-Arrays.

## Install

```
npm install -save svelte-generic-crud-table
```

# Usage
Use the svelte-generic-crud-table in your component to show and, if you like, edit,update and delete it's content.
Just include the table as seen in the example below.

### Displays all data without any CRUD option:
```
    <SvelteGenericCrudTable table={myObjectArray}/>
```
All parameters are optional ;)

[Generic CRUD Table](https://github.com/ivosdc/svelte-generic-crud-table/raw/master/assets/generic-crud-table.png "Svelte GenericCrudTable")
###  Set options:
```
<script>
    import SvelteGenericCrudTable from "svelte-generic-crud-table";

    function handleDelete(event) {
        const id = event.detail.id; // position in myObjectArray
        const body = event.detail.body; // object to delete
        // refer id with event.detail.body.id for database operations!
        // your code here
        console.log(JSON.stringify(event.detail.body));
    }

    function handleUpdate(event) {
        const id = event.detail.id;
        const body = event.detail.body;

        console.log(JSON.stringify(body));
    }

    function handleCreate(event) {
        // better integration in SvelteGenericCrudTable not finished yet.
        console.log(JSON.stringify(event.detail));
    }

    function handleDetails(event) {
        const id = event.detail.id;
        const body = event.detail.body;
        console.log(JSON.stringify(body));
    }

    // example object array. This should be your db query result.
    const myObjectArray = [
        {id: 1, name: "A_NAME", sthg: "A_STHG", why: 'because'},
        {id: 2, name: "ANOTHER_NAME", sthg: "ANOTHER_STHG", why: 'I can'},
        {id: 3, name: "svelte-generic-crud-table", sthg: "Awesome !", why: '!'}
    ]
</script>

<main>
    <SvelteGenericCrudTable  on:delete={handleDelete}
                             on:update={handleUpdate}
                             on:create={handleCreate}
                             on:details={handleDetails}
                             name="tableName"
                             show_fields={[             //optional: not set = show all
                                {name: '200px'},
                                {sthg: '20%'},
                                {why: '100px'}
                             ]}
                             editable_fields={['name', 'why']}
                             options={['CREATE', 'EDIT', 'DELETE', 'DETAILS']}
                             table={myObjectArray}/>
</main>
...
```

- dispatches UPDATE, DELETE, CREATE for individual object handling.
- dispatches DETAILS to handle Object detail handling.
- `name`: the individual table name. It's an identifier for the elements.
- `show_fields`: List of fields to display with its width. Type: `{fieldname: 'width'}`. If no fields are set all fields will be shown.
- `editable_fields`: List the 'editable' fields in your object. E.g. editing the id makes no sense in most cases, so it is not listed here.
- `options`: set the options for your table. Displays/hides button for `'CREATE', 'EDIT', 'DELETE', 'DETAILS'`.
- `table`: The object-array. Your data to show.


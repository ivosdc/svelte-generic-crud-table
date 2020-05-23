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


Your Component

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
                             editable={['name']}
                             options={['EDIT', 'DELETE', 'DETAILS']}
                             table={myObjectArray}/>
</main>
...
```

- dispatches UPDATE, DELETE, CREATE for individual object handling.
- name: the individual table name. It's an identifier for the elements.
- editable: List the 'editable' fields in your object. E.g. editing the id makes no sense in most cases, so it is not listed here.
- table: The object-array. Your data to show.

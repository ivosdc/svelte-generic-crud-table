# svelte-generic-crud-table

A minimal Self-Contained svelte table example.  
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

    function handleDelete(e) {
        // your code here
    }

    function handleUpdate(e) {
        // your code here
    }

    function handleCreate(e) {
        // your code here
    }

    const myObjectArray = [
        {id: 1, name: "A_NAME_1", sthg: "A_STHG_1"},
        {id: 2, name: "A_NAME_2", sthg: "A_STHG_2"}
    ]
</script>

<main>
    <SvelteGenericCrudTable  on:delete={handleDelete}
                             on:update={handleUpdate}
                             on:create={handleCreate}
                             name="tableName"
                             editable={['name']}
                             table={myObjectArray}/>

</main>
...
```

- dispatches UPDATE, DELETE, CREATE for individual object handling.
- name: the individual table name. It's an identifier for the elements.
- editable: List the 'editable' fields in your object. E.g. editing the id makes no sense in most cases, so it is not listed here.
- table: The object-array. Your data to show.

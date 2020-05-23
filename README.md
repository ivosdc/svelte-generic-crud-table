# svelte-generic-crud-table

A minimal Self-Contained svelte table example.  
Allows CRUD-operations for Object-Arrays.

## Install

```sh
npm install -save svelte-generic-crud-table
```

# Usage
Use the svelte-generic-crud-table in your component to show and, if you like, edit,update and delete it's content.
Just include the table as seen in the example below.


Your Component
```html
<script>
    import SvelteGenericCrudTable from "./SvelteGenericCrudTable/svelte-generic-crud-table";
    ...
</script>


<main>
<SvelteGenericCrudTable on:delete={handleDelete}
           on:update={handleUpdate}
           on:create={handleCreate}
           name="tableName"
           editable={['name']}
           table={myObjectArray}/>```
</main>
...
```html

- dispatches UPDATE, DELETE, CREATE for individual object handling.
- name: the individual table name. It's an identifier for the elements.
- editable: List the 'editable' fields in your object. E.g. editing the id makes no sense in most cases, so it is not listed here.
- table: The object-array. Your data to show.

# svelte-generic-crud-table
- Web-component: `<crud-table></crud-table>`
- or Svelte-component: `import SvelteGenericCrudTable from 'svelte-generic-crud-table'`

A self-containing sortable table component with inline edit option.

Allows CRUD-operations for Object-Arrays.

[Try out live example:](https://ivosdc.github.io/svelte-generic-crud-table/ "GeneralCrudTable Example")

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/svelte-generic-crud-table)


## Install

```
npm install svelte-generic-crud-table --save-dev
```


# Usage - table_config
Use the svelte-generic-crud-table in your component to show and, if you like, edit, update and delete it's content.
Just include the table as seen in the example below.

## name
This is used as `id` for the component.

## options
- 'CREATE' - activates the add-icon to fire the create-event.
- 'EDIT' - activates the edit-icon to set the table-row in edit-mode.
- 'DELETE' - activates the delete-icon to fire the delete-event.
- 'DETAILS' - activates the details-icon or showa the alternative details_text if configured to fire the details-event.


The events contain the element from the `crud-table` with the table-id and eventually made changes to the element. Additionally the original element with all it's `hidden fields -> column_setting:show true/false`.

As webcomponent use `event.target`.
As Svelte-Component use `event.detail` to fetch the data.

Have a look inside `event.target.body` / `event.detail.body` to see original element.


## column setting
All fields are optional.

Settings regarding a column behaviour can be specified in the table_config.
Only wanted keys of your source array have to be mapped by columns_settings *name*. All other attributes are optional.
```html
    const table_config = {
        name: 'Awesome',
        options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
        columns_setting: [
            {name: 'id', show: false, edit: true, width: '0px'},
            {name: 'job', displayName: 'Top-Jobs', show: true, edit: true, width: '150px', description: 'The job'},
            {name: 'name', displayName: 'Account-ID', show: true, edit: true, width: '150px', tooltip: true},
            {name: 'private', show: true, edit: false, width: '200px', description: 'your things', tooltip: true},
            {name: 'html', show: true, edit: true, width: '500px', type: 'html', description: 'You can use HTML', tooltip: true}
        ],
        details_text: 'detail'   // replace the standard icon with an text-link
    }
```
- <b>*name*</b>: the key from your data-array. This is used as column name.
- *displayName*: An alternative column header if *name* is not matching the needs.
- *show*: true/false; Should this column displayed? (optional, default: false)
- *edit*: true/false; Set this field editable or not. (optional, default: false)
- *width*: px/em; set the field width.  (optional, default: 100px)
- *description*: A tooltip for the columns name. E.g. to see the full name or other description.  (optional, default: unset)
- *tooltip*: true/false; When the text does not fit into the field you can show the full text as tooltip.  (optional, default: false) 
- *type*: There are two types:  (optional, default: text)
    - *text*: Default.
    - *html*: The value/text will be interpreted as HTML.

## details_text
You can replace the icon for "DETAILS" by a text. Perhaps you like to specify the acvtion behind the button more concrete.



[See example:](https://ivosdc.github.io/svelte-generic-crud-table/ "GeneralCrudTable Example")

### `<crud-table></crud-table>`
```html
<custom-element-demo>
<template>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width,initial-scale=1'>
    <title>Generic Crud Table</title>
    <link rel='icon' type='image/png' href='favicon.png'>
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
```html
<script>
    import SvelteGenericCrudTable from "svelte-generic-crud-table";
    import {onMount} from 'svelte';
    import {goto} from "@sapper/app";

    let myData = [];

    onMount(reload);

    function reload() {
        get().then( (result) => {
                myData = result;
        });
    }

    function handleCreate(event) {
        post({name: "new entry"}).then(() => {
                    reload();
                });
    }


    function handleDelete(event) {
        delete(event.detail.body.id).then(() => {
                    reload();
                });
    }

    function handleUpdate(event) {
        update(event.detail.body.id, event.detail.body)
                .then(() => {
                    reload();
                });
    }

    function handleDetail(event) {
        goto('/project/' + event.detail.body.id);
    }

    
    const table_config = {
        name: 'Awesome',
        options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
        columns_setting: [
            {name: 'id', show: false, edit: true, width: '200px'},
            {name: 'job', show: true, edit: true, width: '100px', description: 'Your Job'},
            {name: 'name', show: true, edit: true, width: '200px', tooltip: true},
            {name: 'private', show: true, edit: false, width: '200px', description: 'Your things'},
            {name: 'html', show: true, edit: true, size: '200px', type: 'html', tooltip: true}
        ],
        details_text: 'detail'   // replace the standard icon with an text-link
    }

</script>

<main>
    <SvelteGenericCrudTable on:delete={handleDelete}
                            on:update={handleUpdate}
                            on:create={handleCreate}
                            on:details={handleDetail}
                            table_config={table_config}
                            table_data={myData}/>
</main>

```

I recommend for Svelte-Users the direct import of the component source `"svelte-generic-crud-table/src/SvelteGenericCrudTable.svelte"`.
```html
// import SvelteGenericCrudTable from "svelte-generic-crud-table";
import SvelteGenericCrudTable from "svelte-generic-crud-table/src/SvelteGenericCrudTable.svelte";
```
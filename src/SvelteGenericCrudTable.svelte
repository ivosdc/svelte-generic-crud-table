<svelte:options tag={'crud-table'}/>
<script>
    import {createEventDispatcher} from 'svelte';
    import {SvelteGenericCrudTableService} from "./SvelteGenericCrudTableService";
    import icontrash from './icons/bin2.svg';
    import iconedit from './icons/pencil2.svg';
    import iconsend from './icons/save.svg';
    import iconcancel from './icons/cross.svg';
    import icondetail from './icons/info.svg';
    import iconcreate from './icons/plus.svg';

    let shadowed = false;
    if (document.querySelector('crud-table')) {
        shadowed = true;
    }

    const dispatch = createEventDispatcher();

    const EDIT = 'EDIT';
    const DELETE = 'DELETE';
    const CREATE = 'CREATE';
    const DETAILS = 'DETAILS';

    const table_config_default = {
        name: 'crud-table',
        options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
        columns_setting: []
    }

    export let table_data = {};
    $: table_data = (typeof table_data === 'string') ? JSON.parse(table_data) : table_data;

    export let table_config = table_config_default;
    $: table_config = (typeof table_config === 'string') ? JSON.parse(table_config) : table_config;

    let name = '';
    $: name = table_config.name;

    let options = [];
    $: options = (typeof table_config.options !== 'undefined') ? table_config.options : [];

    const NO_ROW_IN_EDIT_MODE = -1;
    let cursor = NO_ROW_IN_EDIT_MODE;
    let genericCrudTable = new SvelteGenericCrudTableService(table_config, shadowed);
    $: genericCrudTable = new SvelteGenericCrudTableService(table_config, shadowed);

    function handleEdit(id) {
        resetRawInEditMode(id);
        cursor = id;
        for (let i = 0; i < table_data.length; i++) {
            genericCrudTable.resetEditMode(i);
        }
        genericCrudTable.setEditMode(id);
    }

    function handleCancelEdit(id) {
        Object.entries(table_data[id]).forEach((elem) => {
            if (shadowed) {
                document.querySelector('crud-table').shadowRoot.getElementById(name + genericCrudTable.getKey(elem) + id).value =
                        document.querySelector('crud-table').shadowRoot.getElementById(name + genericCrudTable.getKey(elem) + id + 'copy').innerText;
            } else {
                document.getElementById(name + genericCrudTable.getKey(elem) + id).value =
                        document.getElementById(name + genericCrudTable.getKey(elem) + id + 'copy').innerText;
            }
        });
        genericCrudTable.resetEditMode(id);
        genericCrudTable.resetDeleteMode(id);
        cursor = NO_ROW_IN_EDIT_MODE;
    }

    function handleEditConfirmation(id, event) {
        resetRawInEditMode(id);
        Object.entries(table_data[id]).forEach((elem) => {
            if (shadowed) {
                document.querySelector('crud-table').shadowRoot.getElementById(name + genericCrudTable.getKey(elem) + id + 'copy').innerText =
                        document.querySelector('crud-table').shadowRoot.getElementById(name + genericCrudTable.getKey(elem) + id).value;
            } else {
                document.getElementById(name + genericCrudTable.getKey(elem) + id + 'copy').innerText =
                        document.getElementById(name + genericCrudTable.getKey(elem) + id).value;
            }
        });
        const body = genericCrudTable.gatherUpdates(id, table_data);
        const details = {
            id: id,
            body: body
        };
        genericCrudTable.resetEditMode(id);
        dispatcher('update', details, event);
    }

    function handleDelete(id) {
        resetRawInEditMode(id);
        genericCrudTable.resetDeleteMode(id)
        cursor = id;
        genericCrudTable.setDeleteMode(id);
    }

    function handleCancelDelete(id) {
        genericCrudTable.resetEditMode(id);
        genericCrudTable.resetDeleteMode(id);
    }

    function handleDeleteConfirmation(id, event) {
        const body = genericCrudTable.gatherUpdates(id, table_data);
        const details = {
            id: id,
            body: body
        };
        genericCrudTable.resetDeleteMode(id);
        cursor = NO_ROW_IN_EDIT_MODE;
        dispatcher('delete', details, event);
    }

    function handleCreate(event) {
        let details = event.detail;
        dispatcher('create', details, event);
    }

    function dispatcher(name, details, event) {
        if (shadowed) {
            event.target.dispatchEvent(
                    new CustomEvent(name, {
                        composed: true,
                        detail: details
                    }))
        } else {
            dispatch(name, details);
        }
    }


    function handleDetails(id, event) {
        resetRawInEditMode(id);
        const body = genericCrudTable.gatherUpdates(id, table_data);
        const details = {
            id: id,
            body: body
        };
        dispatcher('details', details, event);
    }


    function resetRawInEditMode(id) {
        if ((cursor !== id) && (cursor !== NO_ROW_IN_EDIT_MODE)) {
            handleCancelEdit(cursor);
        }
    }

    function handleSort(elem, event) {
        let column = {column: elem};
        dispatcher('sort', column, event);
    }

</script>

<main>
    <h3>{name}</h3>
    {#if (table_data !== undefined)}
        {#if Array.isArray(table_data)}
            <table>
                {#each table_data as tableRow, i}
                    {#if i === 0}
                        <tr>
                            {#each table_config.columns_setting as elem}
                                <td class="headline {genericCrudTable.isShowField(elem.name) === false ? 'hidden' : 'shown'}"
                                    width="{genericCrudTable.getShowFieldWidth(elem.name)}"
                                    on:click={(e) => handleSort(elem.name, e)}>
                                    <textarea class="sortable" value={genericCrudTable.makeCapitalLead(elem.name)}
                                              disabled></textarea>
                                </td>
                            {/each}
                            <td id="labelOptions" class="headline">
                                <textarea value="" disabled></textarea>
                            </td>
                        </tr>
                    {/if}
                    <tr class="row">
                        {#each table_config.columns_setting as column_order, j}
                            {#each Object.entries(tableRow) as elem, k}
                                {#if (column_order.name === genericCrudTable.getKey(elem))}
                                    <td class="{genericCrudTable.isShowField(column_order.name) === false ? 'hidden' : 'shown'}"
                                        width="{genericCrudTable.getShowFieldWidth(column_order.name)}">
                                <textarea id="{name}{column_order.name}{i}"
                                          aria-label="{name}{column_order.name}{i}"
                                          value={genericCrudTable.getValue(elem)} disabled></textarea>
                                        <div class="hidden"
                                             id="{name}{column_order.name}{i}copy"
                                             aria-label="{name}{column_order.name}{i}copy">
                                            {genericCrudTable.getValue(elem)}</div>
                                    </td>
                                {/if}
                                {#if table_config.columns_setting.length - 1 === j && Object.entries(tableRow).length - 1 === k }
                                    <td>
                                        <div id="{name}options-default{i}"
                                             aria-label="{name}options-default{i}"
                                             class="options shown">
                                            {#if options.includes(DELETE)}
                                                <div class="options red" on:click={() => handleDelete(i)}
                                                     title="Delete"
                                                     aria-label={name + genericCrudTable.getKey(elem) + i + 'delete'} >
                                                    {@html icontrash}
                                                </div>
                                            {/if}
                                            {#if options.includes(EDIT)}
                                                <div class="options green"
                                                     on:click={(e) => handleEdit(i, e)} title="Edit">
                                                    {@html iconedit}
                                                </div>
                                            {/if}
                                            {#if options.includes(DETAILS)}
                                                <div class="options blue" on:click="{(e) => {handleDetails(i, e)}}"
                                                     title="Details">
                                                    {@html icondetail}
                                                </div>
                                            {/if}
                                        </div>
                                        <div id="{name}options-edit{i}" class="options hidden">
                                            {#if options.includes(EDIT)}
                                                <div class="options green"
                                                     on:click="{(e) => {handleEditConfirmation(i, e)}}"
                                                     title="Update">
                                                    {@html iconsend}
                                                </div>
                                                <div class="options red" on:click="{() => {handleCancelEdit(i)}}"
                                                     title="Cancel"
                                                     aria-label="{name}{genericCrudTable.getKey(elem)}{i}editCancel">
                                                    {@html iconcancel}
                                                </div>
                                            {/if}
                                        </div>
                                        <div id="{name}options-delete{i}"
                                             aria-label="{name}options-delete{i}"
                                             class="options hidden">
                                            {#if options.includes(DELETE)}
                                                <div class="options green"
                                                     on:click={(e) => handleDeleteConfirmation(i, e)}
                                                     title="Delete"
                                                     aria-label="{name}{genericCrudTable.getKey(elem)}{i}deleteConfirmation">
                                                    {@html iconsend}
                                                </div>
                                                <div class="options red" on:click={(e) => handleCancelDelete(i)}
                                                     title="Cancel"
                                                     aria-label="{name}{genericCrudTable.getKey(elem)}{i}deleteCancel">
                                                    {@html iconcancel}
                                                </div>
                                            {/if}
                                        </div>
                                    </td>
                                {/if}
                            {/each}
                        {/each}

                    </tr>
                {/each}
            </table>
            {#if options.includes(CREATE)}
                <div class="options" id="options-create" on:click={handleCreate} title="Create">
                    {@html iconcreate}
                </div>
                <br><br>
            {/if}
        {:else}
            <br>
            table: {table_data}
        {/if}
    {/if}
</main>

<style>
    .red:hover {
        fill: red;
        fill-opacity: 80%;
    }

    .green:hover {
        fill: limegreen;
        fill-opacity: 80%;
    }

    .blue:hover {
        fill: dodgerblue;
        fill-opacity: 80%;
    }


    h3 {
        color: #5f5f5f;
        font-size: 0.85em;
        font-weight: 200;
        padding-left: 0.2em;
    }

    table {
        text-align: left;
        border-collapse: collapse;
        table-layout: fixed;
        width: 100%;
    }

    .headline {
        border-bottom: 1px solid #dddddd;
        cursor: pointer;
    }

    .sortable {
        cursor: pointer;
    }

    td {
        color: #5f5f5f;
        border: none;
        font-size: 0.85em;
        font-weight: 200;
        padding-left: 0.2em;
        float: left;
    }

    #labelOptions {
        color: #aaaaaa;
        font-weight: 100;
        width: 100px;
    }

    .options {
        padding: 0.2em 0.2em 0em;
        float: left;
        min-height: 1.3em;
        font-size: 1em;
        cursor: pointer;
        opacity: 60%;
    }

    .options:hover {
        opacity: 100%;
    }

    #options-create {
        text-align: left;
        height: 1.3em;
        padding-bottom: 1em;
        max-width: 0px;
    }

    .hidden {
        display: none;
    }

    .shown {
        display: block;
    }

    .row {
        margin-top: 0px;
        margin-bottom: 1px;
    }

    .row:hover {
        background-color: #efefef;
    }

    textarea {
        position: relative;
        resize: none;
        top: 0.4em;
        width: 100%;
        min-height: 1.3em;
        max-height: 1.6em;
        padding: 1px 0px 0px;
        background-color: #ffffff;
        border: none;
        font-size: 0.85em;
        font-weight: 300;
        text-overflow: ellipsis;
        white-space: pre;
        overflow: hidden;
        -webkit-transition: box-shadow 0.3s;
        transition: box-shadow 0.3s;
        box-shadow: -6px 6px 0px -5px #aaaaaa, 6px 6px 0px -5px #aaaaaa;
    }

    textarea:not(:disabled) {
        height: 1.6em;
        min-height: 1.6em;
        padding-left: 0.3em;
    }

    textarea:disabled {
        color: #5f5f5f;
        background-color: inherit;
        font-size: 0.85em;
        font-weight: 200;
        box-shadow: none;
        height: 1.3em;
        max-height: 1.3em;
    }

    input:focus,
    textarea:focus,
    select:focus {
        outline: none;
        font-weight: 300;
        box-shadow: -6px 6px 0px -5px #5f5f5f, 6px 6px 0px -5px #5f5f5f;
        white-space: normal;
        overflow: auto;
        padding-top: 1px;
    }

    textarea:not(:focus) {
        max-height: 1.3em;
    }

</style>

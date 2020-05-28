<svelte:options tag={"svelte-generic-crud-table"}/>
<script>
    import {createEventDispatcher} from 'svelte';
    import Icon from 'fa-svelte'
    import {faTrash, faEdit, faPaperPlane, faTimes, faInfo, faPlus} from '@fortawesome/free-solid-svg-icons'
    import {SvelteGenericCrudTableService} from "./SvelteGenericCrudTableService";

    const dispatch = createEventDispatcher();

    const iconTrash = faTrash;
    const iconEdit = faEdit;
    const iconSend = faPaperPlane;
    const iconCancel = faTimes;
    const iconDetail = faInfo;
    const iconCreate = faPlus;

    const EDIT = 'EDIT';
    const DELETE = 'DELETE';
    const CREATE = 'CREATE';
    const DETAILS = 'DETAILS';

    export let name = '';
    export let show_fields = [];
    export let editable_fields = [];
    export let table = [];
    export let options = []

    const NO_ROW_IN_EDIT_MODE = -1;
    let cursor = NO_ROW_IN_EDIT_MODE;
    const genericCrudTable = new SvelteGenericCrudTableService(name, editable_fields, show_fields);


    function handleEdit(id) {
        resetRawInEditMode(id);
        cursor = id;
        for (let i = 0; i < table.length; i++) {
            genericCrudTable.resetEditMode(i);
        }
        genericCrudTable.setEditMode(id);
    }

    function handleCancelEdit(id) {
        Object.entries(table[id]).forEach((elem) => {
            document.getElementById(name + genericCrudTable.getKey(elem) + id).value =
                    document.getElementById(name + genericCrudTable.getKey(elem) + id + 'copy').innerText;
        });
        genericCrudTable.resetEditMode(id);
        genericCrudTable.resetDeleteMode(id);
        cursor = NO_ROW_IN_EDIT_MODE;
    }

    function handleEditConfirmation(id) {
        resetRawInEditMode(id);
        Object.entries(table[id]).forEach((elem) => {
            document.getElementById(name + genericCrudTable.getKey(elem) + id + 'copy').innerText =
                    document.getElementById(name + genericCrudTable.getKey(elem) + id).value;
        });
        const body = genericCrudTable.gatherUpdates(id, table);
        dispatch('update', {
            id: id,
            body: body
        });
        genericCrudTable.resetEditMode(id);
        table = table;
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

    function handleDeleteConfirmation(id) {
        const body = genericCrudTable.gatherUpdates(id, table);
        dispatch('delete', {
            id: id,
            body: body
        });
        genericCrudTable.resetDeleteMode(id);
        table.splice(id, 1);
        cursor = NO_ROW_IN_EDIT_MODE;
        table = table;
    }

    function handleCreate() {
        dispatch('create', {});
    }

    function handleDetails(id) {
        resetRawInEditMode(id);
        const body = genericCrudTable.gatherUpdates(id, table);
        dispatch('details', {
            id: id,
            body: body
        });
    }


    function resetRawInEditMode(id) {
        if ((cursor !== id) && (cursor !== NO_ROW_IN_EDIT_MODE)) {
            handleCancelEdit(cursor);
        }
    }


</script>

<main>
    {#if (table !== undefined)}
        {#if Array.isArray(table)}
            <table>
                {#each table as tableRow, i}
                    {#if i === 0}
                        <tr>
                            {#each Object.keys(tableRow) as elem}
                                <td class="headline {genericCrudTable.isShowField(elem) === false ? 'hidden' : 'shown'}"
                                    width="{genericCrudTable.getShowFieldWidth(elem)}">
                                    <textarea value={genericCrudTable.makeCapitalLead(elem)} disabled></textarea>
                                </td>
                            {/each}
                            <td id="labelOptions" class="headline">
                                <textarea value="" disabled></textarea>
                            </td>
                        </tr>
                    {/if}
                    <tr class="row">
                        {#each Object.entries(tableRow) as elem, j}
                            <td class="{genericCrudTable.isShowField(genericCrudTable.getKey(elem)) === false ? 'hidden' : 'shown'}"
                                width="{genericCrudTable.getShowFieldWidth(genericCrudTable.getKey(elem))}">
                                <textarea id="{name}{genericCrudTable.getKey(elem)}{i}"
                                          aria-label="{name}{genericCrudTable.getKey(elem)}{i}"
                                          value={genericCrudTable.getValue(elem)} disabled></textarea>
                                <div class="hidden"
                                     id="{name}{genericCrudTable.getKey(elem)}{i}copy"
                                     aria-label="{name}{genericCrudTable.getKey(elem)}{i}copy">
                                    {genericCrudTable.getValue(elem)}</div>
                            </td>
                            {#if Object.entries(tableRow).length - 1 === j}
                                <td>
                                    <div id="{name}options-default{i}"
                                         aria-label="{name}options-default{i}"
                                         class="options shown">
                                        {#if options.includes(DELETE)}
                                            <div class="options red" on:click={() => handleDelete(i)}
                                                 title="Delete"
                                                 aria-label="{name}{genericCrudTable.getKey(elem)}{i}delete">
                                                <Icon icon={iconTrash}/>
                                            </div>
                                        {/if}
                                        {#if options.includes(EDIT)}
                                            <div class="options green"
                                                 on:click={() => handleEdit(i)} title="Edit">
                                                <Icon icon={iconEdit}/>
                                            </div>
                                        {/if}
                                        {#if options.includes(DETAILS)}
                                            <div class="options blue" on:click={() => handleDetails(i)} title="Details">
                                                <Icon icon={iconDetail}/>
                                            </div>
                                        {/if}
                                    </div>
                                    <div id="{name}options-edit{i}" class="options hidden">
                                        {#if options.includes(EDIT)}
                                            <div class="options green" on:click={() => handleEditConfirmation(i)}
                                                 title="Update">
                                                <Icon icon={iconSend}/>
                                            </div>
                                            <div class="options red" on:click={() => handleCancelEdit(i)}
                                                 title="Cancel"
                                                 aria-label="{name}{genericCrudTable.getKey(elem)}{i}editCancel">
                                                <Icon icon={iconCancel}/>
                                            </div>
                                        {/if}
                                    </div>
                                    <div id="{name}options-delete{i}"
                                         aria-label="{name}options-delete{i}"
                                         class="options hidden">
                                        {#if options.includes(DELETE)}
                                            <div class="options green" on:click={() => handleDeleteConfirmation(i)}
                                                 title="Delete"
                                                 aria-label="{name}{genericCrudTable.getKey(elem)}{i}deleteConfirmation">
                                                <Icon icon={iconSend}/>
                                            </div>
                                            <div class="options red" on:click={() => handleCancelDelete(i)}
                                                 title="Cancel"
                                                 aria-label="{name}{genericCrudTable.getKey(elem)}{i}deleteCancel">
                                                <Icon icon={iconCancel}/>
                                            </div>
                                        {/if}
                                    </div>
                                </td>
                            {/if}
                        {/each}

                    </tr>
                {/each}
            </table>
            {#if options.includes(CREATE)}
                <div class="options" id="options-create" on:click={handleCreate} title="Create">
                    <Icon icon={iconCreate}/>
                </div>
                <br><br>
            {/if}
        {:else}
            {JSON.stringify(table)}
        {/if}
    {/if}
</main>

<style>
    .red:hover {
        color: red;
    }

    .green:hover {
        color: limegreen;
    }

    .blue:hover {
        color: dodgerblue;
    }

    table {
        text-align: left;
        border-collapse: collapse;
        table-layout: fixed;
        width: 100%;
    }

    .headline {
        border-bottom: 1px solid #dddddd;
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

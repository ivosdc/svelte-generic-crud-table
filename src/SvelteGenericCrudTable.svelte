<script>
    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();
    const EDIT = 'EDIT';
    const DELETE = 'DELETE';
    const DETAILS = 'DETAILS';
    const NO_ROW_IN_EDIT_MODE = -1;

    let row_in_edit_mode = NO_ROW_IN_EDIT_MODE;

    export let name = '';
    export let table = [];
    export let editable = [];
    export let options = [EDIT, DELETE]

    function getKey(elem) {
        return elem.toString().split(',')[0];
    }

    function getKeyCapitalLead(elem) {
        let elemKey = elem.toString().split(',')[0];
        return elemKey[0].toUpperCase() + elemKey.substr(1);
    }

    function getValue(elem) {
        return elem.toString().split(',')[1];
    }

    function resetEditmode(id) {
        editable.forEach((toEdit) => {
            document.getElementById(name + toEdit + id).setAttribute("disabled", "true");
        })
        document.getElementById(name + 'options-default' + id).classList.remove('hidden');
        document.getElementById(name + 'options-default' + id).classList.add('shown');
        document.getElementById(name + 'options-edit' + id).classList.remove('shown');
        document.getElementById(name + 'options-edit' + id).classList.add('hidden');
    }

    function setEditmode(id) {
        editable.forEach((toEdit) => {
            document.getElementById(name + toEdit + id).removeAttribute("disabled");
        })
        document.getElementById(name + 'options-default' + id).classList.add('hidden');
        document.getElementById(name + 'options-default' + id).classList.remove('shown');
        document.getElementById(name + 'options-edit' + id).classList.remove('hidden');
        document.getElementById(name + 'options-edit' + id).classList.add('shown');
    }

    function gatherUpdates(id) {
        const body = {};
        Object.entries(table[0]).forEach((elem) => {
            body[getKey(elem)] = document.getElementById(name + getKey(elem) + id).value;
        })
        return body;
    }

    function resetRawInEditMode(id) {
        if ((row_in_edit_mode !== id) && (row_in_edit_mode !== NO_ROW_IN_EDIT_MODE)) {
            handleCancel(row_in_edit_mode);
        }
    }

    function handleEdit(id) {
        resetRawInEditMode(id);
        row_in_edit_mode = id;
        for (let i = 0; i < table.length; i++) {
            resetEditmode(i);
        }
        setEditmode(id);
    }

    function handleUpdate(id) {
        resetRawInEditMode(id);
        const body = gatherUpdates(id);
        dispatch('update', {
            id: id,
            body: body
        });
    }

    function handleDelete(id) {
        resetRawInEditMode(id);
        const body = gatherUpdates(id);
        dispatch('delete', {
            id: id,
            body: body
        });
    }

    function handleCreate() {
        dispatch('create', {});
    }

    function handleCancel(id) {
        Object.entries(table[id]).forEach((elem) => {
            document.getElementById(name + getKey(elem) + id).value = document.getElementById(name + getKey(elem) + id + 'copy').innerText;
        });
        resetEditmode(id);
        row_in_edit_mode = NO_ROW_IN_EDIT_MODE;
    }

    function handleDetails(id) {
        resetRawInEditMode(id);
        const body = gatherUpdates(id);
        dispatch('details', {
            id: id,
            body: body
        });
    }
</script>

<main>
    {#if (table !== undefined)}
        {#if Array.isArray(table)}
            <table>
                {#each table as tableRow, i}
                    {#if i === 0}
                        <tr>
                            {#each Object.entries(tableRow) as elem}
                                <th>{getKeyCapitalLead(elem)}</th>
                            {/each}
                            <th width="100px">Options</th>
                        </tr>
                    {/if}
                    <tr class="row">
                        {#each Object.entries(tableRow) as elem}
                            <td>
                                <textarea id="{name}{getKey(elem)}{i}" value={getValue(elem)} disabled="true"/>
                                <div class="hidden" id="{name}{getKey(elem)}{i}copy">{getValue(elem)}</div>
                            </td>
                        {/each}
                        <td>
                            <div id="{name}options-default{i}" class="shown">
                                {#if options.includes(DELETE)}
                                    <span class="options" on:click={() => handleDelete(i)}>delete</span>
                                {/if}
                                {#if options.includes(EDIT)}
                                    <span class="options" on:click={() => handleEdit(i)}>edit</span>
                                {/if}
                                {#if options.includes(DETAILS)}
                                    <span class="options" on:click={() => handleDetails(i)}>details</span>
                                {/if}
                            </div>
                            <div id="{name}options-edit{i}" class="hidden">
                                {#if options.includes(EDIT)}
                                    <span class="options" on:click={() => handleUpdate(i)}>update</span>
                                    <span class="options" on:click={() => handleCancel(i)}>cancel</span>
                                {/if}
                            </div>
                        </td>
                    </tr>
                {/each}
            </table>
        {:else}
            {JSON.stringify(table)}
        {/if}
        <button class="button" on:click={handleCreate}>add</button>
    {/if}
</main>

<style>
    table {
        width: 100%;
        text-align: left;
        border-collapse: collapse;
    }

    th {
        border: none;
        border-bottom: 1px solid #dddddd;
        color: #5f5f5f;
        font-size: 0.85em;
        font-weight: 300;
        padding-left: 0.2em;
    }

    td {
        color: #5f5f5f;
        border: none;
        font-size: 0.85em;
        font-weight: 200;
        padding-left: 0.2em;
    }

    .button {
        margin-top: 1em;
        color: #5f5f5f;
        border-radius: 10%;
        background-color: #efefef;
        font-size: 0.85em;
        font-weight: 400;
        width: auto;
        height: auto;
        cursor: pointer;
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

    .options {
        font-size: 0.75em;
        color: #aaaaaa;
        cursor: pointer;
    }

    .options:hover {
        color: #000000;
    }

    textarea {
        position: relative;
        resize: none;
        overflow: auto;
        top: 0.4em;
        width: 100%;
        height: 1.3em;
        padding: 1px;
        background-color: #ffffff;
        border: none;
        font-size: 0.85em;
        font-weight: 300;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        -webkit-transition: box-shadow 0.3s;
        transition: box-shadow 0.3s;
        box-shadow: -6px 6px 0px -5px #aaaaaa, 6px 6px 0px -5px #aaaaaa;
    }

    textarea:disabled {
        color: #5f5f5f;
        background-color: inherit;
        font-size: 0.85em;
        font-weight: 200;
        box-shadow: none;
    }

    input:focus,
    textarea:focus,
    select:focus {
        outline: none;
        font-weight: 300;
        box-shadow: -6px 6px 0px -5px #5f5f5f, 6px 6px 0px -5px #5f5f5f;
    }

    button:focus {
        outline: none;
        font-weight: 300;
    }
</style>

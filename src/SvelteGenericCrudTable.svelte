<script>
    import {createEventDispatcher} from 'svelte';
    import Icon from 'fa-svelte'
    import {faTrash, faEdit, faPaperPlane, faTimes, faInfo, faPlus} from '@fortawesome/free-solid-svg-icons'

    const iconTrash = faTrash;
    const iconEdit = faEdit;
    const iconSend = faPaperPlane;
    const iconCancel = faTimes;
    const iconDetail = faInfo;
    const iconCreate = faPlus;

    const dispatch = createEventDispatcher();
    const EDIT = 'EDIT';
    const DELETE = 'DELETE';
    const CREATE = 'CREATE';
    const DETAILS = 'DETAILS';
    const NO_ROW_IN_EDIT_MODE = -1;

    let cursor = NO_ROW_IN_EDIT_MODE;

    export let name = '';
    export let table = [];
    export let show_fields = [];
    export let fields_width = [];
    export let editable_fields = [];
    export let options = []

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

    function resetEditMode(id) {
        editable_fields.forEach((toEdit) => {
            document.getElementById(name + toEdit + id).setAttribute("disabled", "true");
        })
        document.getElementById(name + 'options-default' + id).classList.remove('hidden');
        document.getElementById(name + 'options-default' + id).classList.add('shown');
        document.getElementById(name + 'options-edit' + id).classList.remove('shown');
        document.getElementById(name + 'options-edit' + id).classList.add('hidden');
    }

    function resetDeleteMode(id) {
        document.getElementById(name + 'options-default' + id).classList.remove('hidden');
        document.getElementById(name + 'options-default' + id).classList.add('shown');
        document.getElementById(name + 'options-delete' + id).classList.remove('shown');
        document.getElementById(name + 'options-delete' + id).classList.add('hidden');
    }

    function setEditMode(id) {
        editable_fields.forEach((toEdit) => {
            document.getElementById(name + toEdit + id).removeAttribute("disabled");
        })
        document.getElementById(name + 'options-default' + id).classList.add('hidden');
        document.getElementById(name + 'options-default' + id).classList.remove('shown');
        document.getElementById(name + 'options-edit' + id).classList.remove('hidden');
        document.getElementById(name + 'options-edit' + id).classList.add('shown');
    }

    function setDeleteMode(id) {
        document.getElementById(name + 'options-default' + id).classList.add('hidden');
        document.getElementById(name + 'options-default' + id).classList.remove('shown');
        document.getElementById(name + 'options-delete' + id).classList.remove('hidden');
        document.getElementById(name + 'options-delete' + id).classList.add('shown');
    }

    function gatherUpdates(id) {
        const body = {};
        Object.entries(table[0]).forEach((elem) => {
            body[getKey(elem)] = document.getElementById(name + getKey(elem) + id).value;
        })
        return body;
    }

    function resetRawInEditMode(id) {
        if ((cursor !== id) && (cursor !== NO_ROW_IN_EDIT_MODE)) {
            handleCancelEdit(cursor);
        }
    }

    function handleEdit(id) {
        resetRawInEditMode(id);
        cursor = id;
        for (let i = 0; i < table.length; i++) {
            resetEditMode(i);
        }
        setEditMode(id);
    }

    function handleUpdate(id) {
        resetRawInEditMode(id);
        const body = gatherUpdates(id);
        dispatch('update', {
            id: id,
            body: body
        });
        resetEditMode(id);
    }

    function handleDelete(id) {
        resetRawInEditMode(id);
        resetDeleteMode(id)
        cursor = id;
        const body = gatherUpdates(id);
        dispatch('delete', {
            id: id,
            body: body
        });
        setDeleteMode(id);
    }

    function handleCreate() {
        dispatch('create', {});
    }

    function handleCancelEdit(id) {
        Object.entries(table[id]).forEach((elem) => {
            document.getElementById(name + getKey(elem) + id).value =
                    document.getElementById(name + getKey(elem) + id + 'copy').innerText;
        });
        resetEditMode(id);
        resetDeleteMode(id);
        cursor = NO_ROW_IN_EDIT_MODE;
    }

    function handleCancelDelete(id) {
        resetEditMode(id);
        resetDeleteMode(id);
    }

    function handleDetails(id) {
        resetRawInEditMode(id);
        const body = gatherUpdates(id);
        dispatch('details', {
            id: id,
            body: body
        });
    }

    function showField(field) {
        let show = false;
        if (show_fields.length === 0) {
            show = true;
        }
        show_fields.forEach((showField) => {
            if (Object.keys(showField)[0] === field) {
                show = true;
            }
        });

        return show;
    }

    function showFieldWidth(field) {
        let width = '';
        show_fields.forEach((showField) => {
            if (Object.keys(showField)[0] === field) {
                width = showField[field];
            }
        });

        return width;
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
                                <td class="headline {showField(getKey(elem)) === false ? 'hidden' : 'shown'}"
                                    width="{showFieldWidth(getKey(elem))}">
                                    <textarea value={getKeyCapitalLead(elem)} disabled></textarea>
                                </td>
                            {/each}
                            <td id="labelOptions" class="headline">
                                <textarea value="" disabled></textarea>
                            </td>
                        </tr>
                    {/if}
                    <tr class="row">
                        {#each Object.entries(tableRow) as elem}
                            <td class="{showField(getKey(elem)) === false ? 'hidden' : 'shown'}"
                                width="{showFieldWidth(getKey(elem))}">
                                <textarea id="{name}{getKey(elem)}{i}" value={getValue(elem)} disabled></textarea>
                                <div class="hidden" id="{name}{getKey(elem)}{i}copy">{getValue(elem)}</div>
                            </td>
                        {/each}
                        <td>
                            <div id="{name}options-default{i}" class="options shown">
                                {#if options.includes(DELETE)}
                                    <div class="options red" on:click={() => handleDelete(i)} title="Delete">
                                        <Icon icon={iconTrash}/>
                                    </div>
                                {/if}
                                {#if options.includes(EDIT)}
                                    <div class="options green" on:click={() => handleEdit(i)} title="Edit">
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
                                    <div class="options green" on:click={() => handleUpdate(i)} title="Update">
                                        <Icon icon={iconSend}/>
                                    </div>
                                    <div class="options red" on:click={() => handleCancelEdit(i)} title="Cancel">
                                        <Icon icon={iconCancel}/>
                                    </div>
                                {/if}
                            </div>
                            <div id="{name}options-delete{i}" class="options hidden">
                                {#if options.includes(DELETE)}
                                    <div class="options green" on:click={() => handleUpdate(i)} title="Delete">
                                        <Icon icon={iconSend}/>
                                    </div>
                                    <div class="options red" on:click={() => handleCancelDelete(i)} title="Cancel">
                                        <Icon icon={iconCancel}/>
                                    </div>
                                {/if}
                            </div>
                        </td>
                    </tr>
                {/each}
            </table>
            {#if options.includes(CREATE)}
                <div class="options" id="options-create" on:click={handleCreate} title="Create">
                    <Icon icon={iconCreate}/>
                </div>
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

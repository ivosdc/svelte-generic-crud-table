<script>
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();

    export let name = '';
    export let table = [];
    export let editable = [];

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

    function handleDelete(id) {
        dispatch('delete', {
            id: id
        });
    }

    function handleCreate() {
        dispatch('create', {});
    }

    function resetEditmode(id) {
        editable.forEach((toEdit) => {
            document.getElementById(name + toEdit + id).readOnly = true;
        })
        document.getElementById(name + 'options' + id).classList.remove('hidden');
        document.getElementById(name + 'options' + id).classList.add('shown');
        document.getElementById(name + 'update' + id).classList.remove('shown');
        document.getElementById(name + 'update' + id).classList.add('hidden');
    }

    function setEditmode(id) {
        editable.forEach((toEdit) => {
            document.getElementById(name + toEdit + id).readOnly = false;
        })
        document.getElementById(name + 'options' + id).classList.add('hidden');
        document.getElementById(name + 'options' + id).classList.remove('shown');
        document.getElementById(name + 'update' + id).classList.remove('hidden');
        document.getElementById(name + 'update' + id).classList.add('shown');
    }

    function handleEdit(id) {

        for (let i = 0; i < table.length; i++) {
            resetEditmode(i);
        }
        setEditmode(id);
    }

    function handleUpdate(id) {
        const body = {};
        Object.entries(table[0]).forEach((elem) => {
            body[getKey(elem)] = document.getElementById(name + getKey(elem) + id).value;
        })
        dispatch('update', {
            id: body.id,
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
                    <tr class="row{i}">
                        {#each Object.entries(tableRow) as elem}
                            <td>
                                <input id="{name}{getKey(elem)}{i}" value={getValue(elem)} readonly="true"/>
                            </td>
                        {/each}
                        <td>
                            <div id="{name}options{i}" class="shown">
                            <span class="options" on:click={() => handleDelete(i)}>delete</span>
                            <span class="options" on:click={() => handleEdit(i)}>edit</span>
                            </div>
                            <div id="{name}update{i}" class="hidden">
                                <span class="options" on:click={() => handleUpdate(i)}>update</span>
                            </div>
                        </td>
                    </tr>
                {/each}
            </table>
        {:else}
            {JSON.stringify(table)}
        {/if}
        <button class="button" on:click={handleCreate}>add {name}</button>
    {/if}
</main>

<style>
    table {
        width: 100%;
        padding: 0.5em;
        text-align: left;
        border-collapse: collapse;
    }

    th {
        border: none;
        border-bottom: 1px solid #dddddd;
        color: #5f5f5f;
        font-size: 0.85em;
        font-weight: 300;
    }

    td {
        color: #5f5f5f;
        border: none;
        font-size: 0.85em;
        font-weight: 200;
    }

    .button {
        margin-top: 1em;
        color: #aaaaaa;
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

    .row:hover {
        background-color: #efefef;
    }

    .options {
        color: #aaaaaa;
        cursor: pointer;
    }

    .options:hover {
        color: #000000;
    }

    input {
        padding: 0px;
        margin: 0px;
        font-size: 0.85em;
        font-weight: 100;
    }

    input:read-only {
        color: #5f5f5f;
        background-color: inherit;
        border: none;
        font-size: 0.85em;
        font-weight: 200;
    }

    input:read-only:hover {
        color: #aaaaaa;
    }
</style>

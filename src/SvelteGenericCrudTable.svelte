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
        const body = gatherUpdates(id);
        dispatch('delete', {
            id: id,
            body: body
        });
    }

    function handleCreate() {
        dispatch('create', {});
    }

    function resetEditmode(id) {
        editable.forEach((toEdit) => {
            document.getElementById(name + toEdit + id).setAttribute("disabled", "true");
        })
        document.getElementById(name + 'options' + id).classList.remove('hidden');
        document.getElementById(name + 'options' + id).classList.add('shown');
        document.getElementById(name + 'update' + id).classList.remove('shown');
        document.getElementById(name + 'update' + id).classList.add('hidden');
    }

    function setEditmode(id) {
        editable.forEach((toEdit) => {
            document.getElementById(name + toEdit + id).removeAttribute("disabled");
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

    function gatherUpdates(id) {
        const body = {};
        Object.entries(table[0]).forEach((elem) => {
            body[getKey(elem)] = document.getElementById(name + getKey(elem) + id).value;
        })
        return body;
    }

    function handleUpdate(id) {
        const body = gatherUpdates(id);
        dispatch('update', {
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
                                <input id="{name}{getKey(elem)}{i}" value={getValue(elem)} disabled="true"/>
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

    input {
        position: relative;
        top: 0.3em;
        width: 100%;
        background-color: #ffffff;
        border: none;
        font-size: 0.85em;
        font-weight: 300;
        -webkit-transition: box-shadow 0.3s;
        transition: box-shadow 0.3s;
        box-shadow: -9px 9px 0px -8px #aaaaaa, 9px 9px 0px -8px #aaaaaa;
    }

    input:disabled {
        color: #5f5f5f;
        background-color: inherit;
        font-size: 0.85em;
        font-weight: 200;
        box-shadow: none;
    }

    input:focus,
    select:focus {
        outline: none;
        font-weight: 300;
        box-shadow: -9px 9px 0px -8px #5f5f5f, 9px 9px 0px -8px#5f5f5f;
    }

    button:focus {
        outline: none;
        font-weight: 300;
    }
</style>

<script>
    import {createEventDispatcher} from 'svelte';
    import {SvelteGenericCrudTableService} from "./SvelteGenericCrudTableService.mjs";
    import {icontrash, iconedit, iconsend, icondetail, iconcancel, iconcreate, iconsave} from './SvgIcon'
    /* istanbul ignore next line */
    export let shadowed = false;
    const dispatch = createEventDispatcher();
    const EDIT = 'EDIT';
    const DELETE = 'DELETE';
    const CREATE = 'CREATE';
    const DETAILS = 'DETAILS';
    const table_config_default = {
        name: 'crud-table',
        options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
        columns_setting: [],
        details_text: 'detail',
        row_settings: {height: '1.3em'}
    }
    /* istanbul ignore next line */
    export let table_data = {};
    /* istanbul ignore next line */
    $: table_data = (typeof table_data === 'string') ? JSON.parse(table_data) : table_data;
    /* istanbul ignore next line */
    export let table_config = table_config_default;
    /* istanbul ignore next line */
    $: table_config = (typeof table_config === 'string') ? JSON.parse(table_config) : table_config;
    let name = '';
    $: name = tableNameToId(table_config.name);
    let options = [];
    /* istanbul ignore next line */
    $: options = (typeof table_config.options !== 'undefined') ? table_config.options : [];
    const NO_ROW_IN_EDIT_MODE = -1;
    let cursor = NO_ROW_IN_EDIT_MODE;
    let genericCrudTableService = new SvelteGenericCrudTableService(table_config, name);
    $: genericCrudTableService = new SvelteGenericCrudTableService(table_config, name);

    function handleEdit(id, event) {
        resetRawInEditMode(id, event);
        cursor = id;
        for (let i = 0; i < table_data.length; i++) {
            genericCrudTableService.resetEditMode(i, event);
        }
        genericCrudTableService.setEditMode(id, event);
    }

    function handleCancelEdit(id, event) {
        genericCrudTableService.resetRawValues(id, table_data, event);
        genericCrudTableService.resetEditMode(id, event);
        genericCrudTableService.resetDeleteMode(id, event);
        cursor = NO_ROW_IN_EDIT_MODE;
    }

    function handleEditConfirmation(id, event) {
        resetRawInEditMode(id, event);
        const body = genericCrudTableService.gatherUpdates(id, table_data, event);
        table_data[id] = body;
        const details = {
            id: id,
            body: body
        };
        genericCrudTableService.resetEditMode(id, event);
        dispatcher('update', details, event);
    }

    function handleDelete(id, event) {
        resetRawInEditMode(id, event);
        genericCrudTableService.resetDeleteMode(id, event)
        cursor = id;
        genericCrudTableService.setDeleteMode(id, event);
    }

    function handleCancelDelete(id, event) {
        genericCrudTableService.resetEditMode(id, event);
        genericCrudTableService.resetDeleteMode(id, event);
    }

    function handleDeleteConfirmation(id, event) {
        const body = genericCrudTableService.gatherUpdates(id, table_data, event);
        const details = {
            id: id,
            body: body
        };
        genericCrudTableService.resetDeleteMode(id, event);
        cursor = NO_ROW_IN_EDIT_MODE;
        dispatcher('delete', details, event);
    }

    function handleCreate(event) {
        let details = event.detail;
        dispatcher('create', details, event);
    }

    function dispatcher(name, details, event) {
        /* istanbul ignore next */
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
        resetRawInEditMode(id, event);
        const body = genericCrudTableService.gatherUpdates(id, table_data, event);
        const details = {
            id: id,
            body: body
        };
        dispatcher('details', details, event);
    }

    function resetRawInEditMode(id, event) {
        if ((cursor !== id) && (cursor !== NO_ROW_IN_EDIT_MODE)) {
            handleCancelEdit(cursor, event);
        }
    }

    function handleSort(elem, event) {
        let column = {column: elem};
        dispatcher('sort', column, event);
    }

    const columnsWidth = [];
    const columnsResize = [];

    function tableNameToId(tableName) {
        return tableName.replace(':', '').replace(' ', '');
    }

    function handleResize(event) {
        let elem = event.target;
        if (columnsResize[elem.id]) {
            let column;
            let querySelector = '[id^="' + elem.id + '-' + tableNameToId(table_config.name) + '"]';
            column = elem.closest('.table').querySelectorAll(querySelector);
            columnsWidth[elem.id] = (elem.offsetWidth - 8) + 'px';
            for (let i = 0; i < column.length; i++) {
                column[i].setAttribute('style', 'width:' + (elem.offsetWidth - 8) + 'px');
            }
        }
    }

    function startResize(event) {
        let elem = event.target;
        columnsResize[elem.id] = true;
    }

    function stopResize(event) {
        let elem = event.target;
        columnsResize[elem.id] = false;
    }

    function getWidth(id) {
        return "width:" + columnsWidth[id] + ";"
    }

    function setWidth(elem, i) {
        if (columnsWidth[i] === undefined) {
            columnsWidth[i] = genericCrudTableService.getShowFieldWidth(elem.name); // incl.px;
        }
        return "width:" + columnsWidth[i] + ";"
    }

    function showTooltipByConfig(event, show, text, type) {
        if (show) {
            genericCrudTableService.tooltip(event, 0, 15, text, type)
        }
    }
</script>

<main>
    {#if (table_data !== undefined)}
        <!-- /* istanbul ignore next line */ -->
        {#if Array.isArray(table_data)}
            <div class="table">
                <div class="thead"
                     style="max-height:{(table_config.row_settings !== undefined) && (table_config.row_settings.height !== undefined) ? table_config.row_settings.height : table_config_default.row_settings.height};">
                    <!-- /* istanbul ignore next line */ -->
                    {#each table_config.columns_setting as elem, index}
                        <!-- /* istanbul ignore next line */ -->
                        <div id={index}
                             class="td headline {genericCrudTableService.isShowField(elem.name) === false ? 'hidden' : 'shown'}"
                             style={setWidth(elem, index)}
                             on:mousedown={startResize}
                             on:mousemove={handleResize}
                             on:mouseup={stopResize}>
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <span aria-label="Sort{elem.name}" class="headline-name"
                                  on:click={(e) => handleSort(elem.name, e)}
                                  on:mouseenter={(e)=>{genericCrudTableService.tooltip(e, 0, 15, elem.description)}}>
                                {genericCrudTableService.makeCapitalLead(elem.name)}
                            </span>
                        </div>
                    {/each}
                    <div id="label-options" class="td">
                        <!-- /* istanbul ignore next line */ -->
                        {#if options.includes(CREATE)}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <div class="options blue" on:click={handleCreate}
                                 title="Create">
                                {@html iconcreate}
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- /* istanbul ignore next line */ -->
                {#each table_data as tableRow, i (tableRow)}
                    <div class="row"
                         class:dark={i % 2 === 0}
                         style="min-height:{(table_config.row_settings !== undefined) && (table_config.row_settings.height !== undefined) ? table_config.row_settings.height : table_config_default.row_settings.height};">
                        {#each table_config.columns_setting as column_order, j}
                            {#each Object.entries(tableRow) as elem, k}
                                <!-- /* istanbul ignore next */ -->
                                {#if (column_order.name === genericCrudTableService.getKey(elem))}
                                    <div id={j + '-' + tableNameToId(table_config.name) + '-' + k}
                                         class="td {genericCrudTableService.isShowField(column_order.name) === false ? 'hidden' : 'shown'}"
                                         style="{getWidth(j)}">
                                        <div id={name + column_order.name + i + '-disabled'}
                                             class="td-disabled shown"
                                             aria-label={name + column_order.name + i + '-disabled'}
                                             on:mouseenter={(e) => {
                                             showTooltipByConfig(e, column_order.tooltip, table_data[i][column_order.name], column_order.type)}}>
                                            {#if column_order.type === 'html'}
                                                {@html table_data[i][column_order.name]}
                                            {:else}
                                                {table_data[i][column_order.name]}
                                            {/if}
                                        </div>
                                        <textarea id={name + column_order.name + i}
                                                  class="hidden"
                                                  aria-label={name + column_order.name + i}>{table_data[i][column_order.name]}</textarea>
                                    </div>
                                {/if}
                                <!-- /* istanbul ignore next line */ -->
                                {#if table_config.columns_setting.length - 1 === j && Object.entries(tableRow).length - 1 === k }
                                    <div class="td">
                                        <div id="{name}options-default{i}"
                                             aria-label="{name}options-default{i}"
                                             class="options-field shown">
                                            <!-- /* istanbul ignore next */ -->
                                            {#if options.includes(DELETE)}
                                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                                <div class="options red" on:click={(e) => handleDelete(i, e)}
                                                     title="Delete"
                                                     aria-label={name + column_order.name + i + 'delete'} tabindex="0">
                                                    {@html icontrash}
                                                </div>
                                            {/if}
                                            <!-- /* istanbul ignore next */ -->
                                            {#if options.includes(EDIT)}
                                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                                <div class="options green"
                                                     on:click={(e) => handleEdit(i, e)} title="Edit" tabindex="0">
                                                    {@html iconedit}
                                                </div>
                                            {/if}
                                            <!-- /* istanbul ignore next */ -->
                                            {#if options.includes(DETAILS)}
                                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                                <div class="options blue" on:click="{(e) => {handleDetails(i, e)}}"
                                                     title="{table_config.details_text !== undefined ? table_config.details_text : 'Details'}"
                                                     tabindex="0">
                                                    {#if table_config.details_text !== undefined}
                                                        {table_config.details_text}
                                                    {:else}
                                                        {@html icondetail}
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                        <div id="{name}options-edit{i}"
                                             class="options-field hidden">
                                            <!-- /* istanbul ignore next */ -->
                                            {#if options.includes(EDIT)}
                                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                                <div class="options green"
                                                     on:click="{(e) => {handleEditConfirmation(i, e)}}"
                                                     title="Update" tabindex="0">
                                                    {@html iconsave}
                                                </div>
                                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                                <div class="options red" on:click="{(e) => {handleCancelEdit(i, e)}}"
                                                     title="Cancel"
                                                     aria-label={name + column_order.name + i + 'editCancel'}
                                                     tabindex="0">
                                                    {@html iconcancel}
                                                </div>
                                            {/if}
                                        </div>
                                        <div id="{name}options-delete{i}"
                                             aria-label="{name}options-delete{i}"
                                             class="options-field hidden">
                                            <!-- /* istanbul ignore next */ -->
                                            {#if options.includes(DELETE)}
                                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                                <div class="options red" on:click={(e) => handleCancelDelete(i, e)}
                                                     title="Cancel"
                                                     aria-label={name + column_order.name + i + 'deleteCancel'}
                                                     tabindex="0">
                                                    {@html iconcancel}
                                                </div>
                                                <div class="options green"
                                                     on:click={(e) => handleDeleteConfirmation(i, e)}
                                                     title="Delete"
                                                     aria-label={name + column_order.name + i + 'deleteConfirmation'}
                                                     tabindex="0">
                                                    {@html iconsend}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                {/if}
                            {/each}
                        {/each}
                    </div>
                {/each}
                {#if table_data.length === 0}
                    <br/>
                    <div class="no-entries">No entries.</div>
                {/if}
            </div>
        {/if}
    {/if}
</main>

<style>

    :root {
        --lightgrey1: #f4f4f4;
        --lightgrey2: #efefef;
        --lightgrey3: #e1e1e1;
        --grey1: #bfbfbf;
        --grey2: #999999;
        --grey3: #666666;
        --darkgrey1: #555555;
        --darkgrey2: #333333;
        --darkgrey3: #1f1f1f;
        --button1: #004666;
        --button2: #4A849F;
        --button3: #A4C8D8;
        --font-size-textarea: 1em;
    }


    main {
        position: inherit;
    }

    .no-entries {
        width: 100%;
        color: #666666;
        text-align: center;
    }

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

    .table {
        display: inline-grid;
        text-align: left;
        border-bottom: 1px solid var(--grey1);
        border-radius: .3em;
    }

    .thead {
        display: inline-flex;
        padding: 0 0 .3em .5em;
        border-radius: inherit;
        border-bottom: 1px solid var(--grey1);
    }

    .row {
        display: inline-flex;
        padding: .5em 1em .5em 1em;
        resize: vertical;
        border-radius: inherit;
        border: 1px solid var(--lightgrey3);
    }

    .dark {
        background-color: #efefef;
    }

    .row:hover {
        transition: all .1s ease-in;
        background-color: rgba(0, 0, 0, 0.1);
    }

    .td {
        color: #5f5f5f;
        border: none;
        font-weight: 100;
        float: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        resize: none;
        height: inherit;
    }

    .td-disabled {
        vertical-align: middle;
        color: #5f5f5f;
        border: none;
        font-weight: 200;
        float: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        margin-left: .5em;
    }

    .headline {
        font-weight: 300;
        resize: horizontal;
        padding-left: 1em;
        line-height: 1em;
        border-radius: inherit;
    }

    .headline-name:hover {
        cursor: pointer;
        color: var(--darkgrey3);
        font-weight: bolder;
    }

    #label-options {
        width: fit-content;
        resize: none;
    }

    .options-field {
        width: fit-content;
        opacity: 60%;
        resize: inherit;
        padding-left: .5em;
    }

    .options {
        float: left;
        position: relative;
        width: fit-content;
        height: 16px;
        padding: 0.3em;
        cursor: pointer;
        fill: #999999;
        color: #666666;
        line-height: 0.9em;
    }

    .options:hover {
        color: #333333;
        text-decoration: underline;
    }

    .options:focus {
        border: none;
        outline: none;
        opacity: 100%;
    }

    .hidden {
        display: none;
    }

    .shown {
        display: block;
    }

    textarea {
        position: relative;
        resize: vertical;
        overflow: hidden;
        width: calc(100% - 1em);
        height: calc(100% - .5em);
        padding-left: .5em;
        background-color: #ffffff;
        font-size: var(--font-size-textarea);
        font-weight: 300;
        font-family: inherit;
        text-overflow: ellipsis;
        white-space: pre;
        overflow-y: scroll;
        border: 1px solid var(--lightgrey3);
    }

    textarea:focus {
        outline: none;
        font-weight: 100;
        white-space: normal;
        overflow: auto;
    }

    textarea:not(:focus) {
        height: calc(100% - .5em);
    }
</style>
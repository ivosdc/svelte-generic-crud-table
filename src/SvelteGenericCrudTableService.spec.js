import {SvelteGenericCrudTableService} from './SvelteGenericCrudTableService'

const config = {
    name: '',
    options: [],
    columns_setting: [
        {name: 'id', show: false, edit: true, width: '200px'},
        {name: 'name', show: true, edit: true, width: '200px'}
    ],
    row_settings: {height: '1.3em'}
}


describe('Test SvelteGenericCrudTableService', () => {

    const genericCrudTable = new SvelteGenericCrudTableService(config, '');


    it('testGetKey', async () => {
        let actual = genericCrudTable.getKey(["name", "A_VALUE"])

        expect(actual).toBe('name')
    })

    it('testMakeCapitalLead', async () => {
        let actual = genericCrudTable.makeCapitalLead("name")

        expect(actual).toBe('Name')
    })

    it('testGetValue', async () => {
        let actual = genericCrudTable.getValue(["name", "A_VALUE"])

        expect(actual).toBe('A_VALUE')
    })

    it('testResetEditMode', async () => {
        const toEdit = 'name';
        const documentHTML = '<!doctype html><html><body>' +
            '<crud-table>' +
            '<div class="table">' +
            '<div class="row">' +
            '<div id="' + toEdit + '0' + '"></div>' +
            '<div id="' + toEdit + '0' + '-disabled"></div>' +
            '<div id="' + config.name + 'options-default0"></div>' +
            '<div id="' + config.name + 'options-edit0"></div>' +
            '</div>' +
            '</div>' +
            '</crud-table>' +
            '</body></html>';
        document.body.innerHTML = documentHTML;

        const crudTable = document.querySelector('crud-table');
        const shadowRoot = crudTable.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = documentHTML;

        let row = document.getElementsByClassName('row')[0];
        let e = {target: {closest: ()=> row}}
        genericCrudTable.resetEditMode(0, e)

        expect(document.getElementById(config.name + toEdit + '0-disabled').classList.contains('shown')).toBe(true);

        expect(document.getElementById(config.name + "options-default0").classList.contains('hidden')).toBe(false);
        expect(document.getElementById(config.name + "options-default0").classList.contains('shown')).toBe(true);

        expect(document.getElementById(config.name + "options-edit0").classList.contains('hidden')).toBe(true);
        expect(document.getElementById(config.name + "options-edit0").classList.contains('shown')).toBe(false);
    })

    it('testSetEditMode', async () => {
        const toEdit = 'name';
        const documentHTML = '<!doctype html><html><body>' +
            '<crud-table>' +
            '<div class="table">' +
            '<div class="row">' +
            '<div id="' + toEdit + '0' + '"></div>' +
            '<div id="' + toEdit + '0' + '-disabled"></div>' +
            '<div id="options-default0"></div>' +
            '<div id="options-edit0"></div>' +
            '</div>' +
            '</div>' +
            '</crud-table>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        const crudTable = document.querySelector('crud-table');
        const shadowRoot = crudTable.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = documentHTML;

        let row = document.getElementsByClassName('row')[0];
        let e = {target: {closest: ()=> row}}

        genericCrudTable.setEditMode(0, e)


        expect(document.getElementById(config.name + toEdit + '0').classList.contains('shown')).toBe(true)

        expect(document.getElementById(config.name + "options-default0").classList.contains('hidden')).toBe(true);
        expect(document.getElementById(config.name + "options-default0").classList.contains('shown')).toBe(false);

        expect(document.getElementById(config.name + "options-edit0").classList.contains('hidden')).toBe(false);
        expect(document.getElementById(config.name + "options-edit0").classList.contains('shown')).toBe(true);
    })

    it('testResetDeleteMode', async () => {
        const documentHTML = '<!doctype html><html><body>' +
            '<crud-table>' +
            '<div class="table">' +
            '<div class="row">' +
            '<div id="options-default"></div>' +
            '<div id="options-delete"></div>' +
            '</div>' +
            '</div>' +
            '</crud-table>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        const crudTable = document.querySelector('crud-table');
        const shadowRoot = crudTable.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = documentHTML;
        let target = document.getElementById('options-default');

        let table = document.getElementsByClassName('table')[0];
        let e = {target: {closest: ()=> table}}
        genericCrudTable.resetDeleteMode('', e)

        expect(document.getElementById(config.name + "options-default").classList.contains('hidden')).toBe(false);
        expect(document.getElementById(config.name + "options-default").classList.contains('shown')).toBe(true);

        expect(document.getElementById(config.name + "options-delete").classList.contains('hidden')).toBe(true);
        expect(document.getElementById(config.name + "options-delete").classList.contains('shown')).toBe(false);
    })


    it('testSetDeleteMode', async () => {
        const documentHTML = '<!doctype html><html><body>' +
            '<crud-table>' +
            '<div class="table">' +
            '<div class="row">' +
            '<div id="options-default"></div>' +
            '<div id="options-delete"></div>' +
            '</div>' +
            '</div>' +
            '</crud-table>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        const crudTable = document.querySelector('crud-table');
        const shadowRoot = crudTable.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = documentHTML;

        let table = document.getElementsByClassName('table')[0];
        let e = {target: {closest: ()=> table}}
        genericCrudTable.setDeleteMode('', e)

        expect(document.getElementById(config.name + "options-default").classList.contains('hidden')).toBe(true);
        expect(document.getElementById(config.name + "options-default").classList.contains('shown')).toBe(false);

        expect(document.getElementById(config.name + "options-delete").classList.contains('hidden')).toBe(false);
        expect(document.getElementById(config.name + "options-delete").classList.contains('shown')).toBe(true);

    })

    it('testGatherUpdates', async () => {
        const table = [{id: 42, name: 'A_NAME'}];
        const documentHTML = '<!doctype html><html><body>' +
            '<crud-table>' +
            '<div class="table">' +
            '<div class="row">' +
            '<input id="' + config.name + 'id0" value="42"/>' +
            '<input id="' + config.name + 'name0" value="A_NAME"/>' +
            '</div>' +
            '</div>' +
            '</crud-table>' +
            '</body></html>';
        document.body.innerHTML = documentHTML;

        const crudTable = document.querySelector('crud-table');
        const shadowRoot = crudTable.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = documentHTML;

        let tableelem = document.getElementsByClassName('table')[0];
        let e = {target: {closest: ()=> tableelem}}
        let actual = genericCrudTable.gatherUpdates(0, table, e);

        expect(table[0]).toStrictEqual(actual);
    })

    it('testResetRawValues', async () => {
        const table = [{id: 42, name: 'A_NAME'}];
        const documentHTML = '<!doctype html><html><body>' +
            '<crud-table>' +
            '<div class="table">' +
            '<div class="row">' +
            '<input id="' + config.name + 'id0" value="424242"/>' +
            '<input id="' + config.name + 'name0" value="ANOTHER_NAME"/>' +
            '</div>' +
            '</div>' +
            '</crud-table>' +
            '</body></html>';
        document.body.innerHTML = documentHTML;

        const crudTable = document.querySelector('crud-table');
        const shadowRoot = crudTable.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = documentHTML;

        let tableelem = document.getElementsByClassName('table')[0];
        let e = {target: {closest: ()=> tableelem}}
        genericCrudTable.resetRawValues(0, table, e);

        expect(document.getElementById(config.name + 'id0').value).toBe('424242');
        expect(document.getElementById(config.name + 'name0').value).toBe('A_NAME');
    })

    it('testIsShowField', async () => {
        const toShow = 'name';
        let actual = genericCrudTable.isShowField(toShow);

        expect(actual).toBe(true);
    })

    it('testIsShowField_noFieldsSet', async () => {
        const toShow = 'name';
        genericCrudTable.show_fields = [];

        let actual = genericCrudTable.isShowField(toShow);

        expect(actual).toBe(true);
    })


    it('testIsShowField_dontShow', async () => {
        let actual = genericCrudTable.isShowField('NO_SHOW_FIELD');

        expect(actual).toBe(false);
    })

    it('testGetShowFieldWidth', async () => {
        let actual = genericCrudTable.getShowFieldWidth('name');

        expect(actual).toBe('200px');
    })


    it('testGetShowFieldWidth_noWidth', async () => {
        const config = {
            name: '',
            options: [],
            columns_setting: [
                {name: 'name', show: true, edit: true}
            ]
        }
        const genericCrudTable = new SvelteGenericCrudTableService(config);
        let actual = genericCrudTable.getShowFieldWidth('name');

        expect(actual).toBe('100px');
    })

});

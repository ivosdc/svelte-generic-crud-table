import {SvelteGenericCrudTableService} from './SvelteGenericCrudTableService'


const config = {
    name: '',
    options: [],
    columns_setting: [
        {name: 'id', show: false, edit: true, width: '200px'},
        {name: 'name', show: true, edit: true, width: '200px'}
    ]
}

describe('shadow DOM Test SvelteGenericCrudTableService', () => {
   let genericCrudTable = new SvelteGenericCrudTableService(config, true);
    runTest(genericCrudTable);
});

describe('light DOM Test SvelteGenericCrudTableService', () => {
    let genericCrudTable = new SvelteGenericCrudTableService(config, false);
    runTest(genericCrudTable);
});

function runTest(genericCrudTable) {

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
            '<div id=' + toEdit + '0' + '></div>' +
            '<div id="options-default0"></div>' +
            '<div id="options-edit0"></div>' +
            '</crud-table>' +
            '</body></html>';
        document.body.innerHTML = documentHTML;

        const crudTable = document.querySelector('crud-table');
        const shadowRoot = crudTable.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = documentHTML;

        let actual = genericCrudTable.resetEditMode(0)

        if (genericCrudTable.shadowed) {
            expect(document.querySelector('crud-table').shadowRoot.getElementById(toEdit + '0').getAttribute('disabled')).toBe('true')

            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-default0").classList.contains('hidden')).toBe(false);
            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-default0").classList.contains('shown')).toBe(true);

            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-edit0").classList.contains('hidden')).toBe(true);
            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-edit0").classList.contains('shown')).toBe(false);

        } else {

            expect(document.getElementById(toEdit + '0').getAttribute('disabled')).toBe('true')

            expect(document.getElementById("options-default0").classList.contains('hidden')).toBe(false);
            expect(document.getElementById("options-default0").classList.contains('shown')).toBe(true);

            expect(document.getElementById("options-edit0").classList.contains('hidden')).toBe(true);
            expect(document.getElementById("options-edit0").classList.contains('shown')).toBe(false);
        }
    })

    it('testSetEditMode', async () => {
        const toEdit = 'name';
        const documentHTML = '<!doctype html><html><body>' +
            '<crud-table>' +
            '<div id=' + toEdit + '0' + ' disabled></div>' +
            '<div id="options-default0"></div>' +
            '<div id="options-edit0"></div>' +
            '</crud-table>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        const crudTable = document.querySelector('crud-table');
        const shadowRoot = crudTable.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = documentHTML;

        let actual = genericCrudTable.setEditMode(0)

        if (genericCrudTable.shadowed) {
            expect(document.querySelector('crud-table').shadowRoot.getElementById(toEdit + '0').getAttribute('disabled')).toBe(null)

            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-default0").classList.contains('hidden')).toBe(true);
            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-default0").classList.contains('shown')).toBe(false);

            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-edit0").classList.contains('hidden')).toBe(false);
            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-edit0").classList.contains('shown')).toBe(true);

        } else {
            expect(document.getElementById(toEdit + '0').getAttribute('disabled')).toBe(null)

            expect(document.getElementById("options-default0").classList.contains('hidden')).toBe(true);
            expect(document.getElementById("options-default0").classList.contains('shown')).toBe(false);

            expect(document.getElementById("options-edit0").classList.contains('hidden')).toBe(false);
            expect(document.getElementById("options-edit0").classList.contains('shown')).toBe(true);
        }
    })

    it('testResetDeleteMode', async () => {
        const documentHTML = '<!doctype html><html><body>' +
            '<crud-table>' +
            '<div id="options-default"></div>' +
            '<div id="options-delete"></div>' +
            '</crud-table>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        const crudTable = document.querySelector('crud-table');
        const shadowRoot = crudTable.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = documentHTML;

        let actual = genericCrudTable.resetDeleteMode('')

        if (genericCrudTable.shadowed) {
            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-default").classList.contains('hidden')).toBe(false);
            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-default").classList.contains('shown')).toBe(true);

            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-delete").classList.contains('hidden')).toBe(true);
            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-delete").classList.contains('shown')).toBe(false);

        } else {
            expect(document.getElementById("options-default").classList.contains('hidden')).toBe(false);
            expect(document.getElementById("options-default").classList.contains('shown')).toBe(true);

            expect(document.getElementById("options-delete").classList.contains('hidden')).toBe(true);
            expect(document.getElementById("options-delete").classList.contains('shown')).toBe(false);
        }
    })


    it('testSetDeleteMode', async () => {
        const documentHTML = '<!doctype html><html><body>' +
            '<crud-table>' +
            '<div id="options-default"></div>' +
            '<div id="options-delete"></div>' +
            '</crud-table>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        const crudTable = document.querySelector('crud-table');
        const shadowRoot = crudTable.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = documentHTML;

        let actual = genericCrudTable.setDeleteMode('')

        if (genericCrudTable.shadowed) {
            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-default").classList.contains('hidden')).toBe(true);
            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-default").classList.contains('shown')).toBe(false);

            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-delete").classList.contains('hidden')).toBe(false);
            expect(document.querySelector('crud-table').shadowRoot.getElementById("options-delete").classList.contains('shown')).toBe(true);
        } else {
            expect(document.getElementById("options-default").classList.contains('hidden')).toBe(true);
            expect(document.getElementById("options-default").classList.contains('shown')).toBe(false);

            expect(document.getElementById("options-delete").classList.contains('hidden')).toBe(false);
            expect(document.getElementById("options-delete").classList.contains('shown')).toBe(true);

        }
    })

    it('testGatherUpdates', async () => {
        const table = [{id: 42, name: 'A_NAME'}];
        const documentHTML = '<!doctype html><html><body>' +
            '<crud-table>' +
            '<input id="id0" value="42"/>' +
            '<input id="name0" value="A_NAME"/>' +
            '</crud-table>' +
            '</body></html>';
        document.body.innerHTML = documentHTML;

        const crudTable = document.querySelector('crud-table');
        const shadowRoot = crudTable.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = documentHTML;

        let actual = genericCrudTable.gatherUpdates(0, table);

        expect(table[0]).toStrictEqual(actual);
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
        const genericCrudTable = new SvelteGenericCrudTableService(config, false);
        let actual = genericCrudTable.getShowFieldWidth('name');

        expect(actual).toBe('');
    })
};

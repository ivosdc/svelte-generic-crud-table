import {SvelteGenericCrudTableService} from './SvelteGenericCrudTableService'

const config = {
    name: '',
    options: [],
    columns_setting: [
        {name: 'name', show: true, edit: true, width: '200px'}
    ]
}
const genericCrudTable = new SvelteGenericCrudTableService(config, false);
const shadowedGenericCrudTable = new SvelteGenericCrudTableService(config, true);

describe('Test SvelteGenericCrudTableService', () => {

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
        const toEdit = 'A_FIELD';
        const config = {
            name: '',
            options: [],
            columns_setting: [
                {name: toEdit, show: true, edit: true, size: '200px'}
            ]
        }
        const genericCrudTable = new SvelteGenericCrudTableService(config, false);
        const documentHTML = '<!doctype html><html><body>' +
            '<div id=' + toEdit + '></div>' +
            '<div id="options-default"></div>' +
            '<div id="options-edit"></div>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        let actual = genericCrudTable.resetEditMode('')

        expect(document.getElementById(toEdit).getAttribute('disabled')).toBe('true')

        expect(document.getElementById("options-default").classList.contains('hidden')).toBe(false);
        expect(document.getElementById("options-default").classList.contains('shown')).toBe(true);

        expect(document.getElementById("options-edit").classList.contains('hidden')).toBe(true);
        expect(document.getElementById("options-edit").classList.contains('shown')).toBe(false);
    })

    it('testSetEditMode', async () => {
        const toEdit = 'A_FIELD';
        const config = {
            name: '',
            options: [],
            columns_setting: [
                {name: toEdit, show: true, edit: true, size: '200px'}
            ]
        }
        const genericCrudTable = new SvelteGenericCrudTableService(config, false);
        const documentHTML = '<!doctype html><html><body>' +
            '<div id=' + toEdit + ' disabled></div>' +
            '<div id="options-default"></div>' +
            '<div id="options-edit"></div>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        let actual = genericCrudTable.setEditMode('')

        expect(document.getElementById(toEdit).getAttribute('disabled')).toBe(null)

        expect(document.getElementById("options-default").classList.contains('hidden')).toBe(true);
        expect(document.getElementById("options-default").classList.contains('shown')).toBe(false);

        expect(document.getElementById("options-edit").classList.contains('hidden')).toBe(false);
        expect(document.getElementById("options-edit").classList.contains('shown')).toBe(true);
    })

    it('testResetDeleteMode', async () => {
        const documentHTML = '<!doctype html><html><body>' +
            '<div id="options-default"></div>' +
            '<div id="options-delete"></div>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        let actual = genericCrudTable.resetDeleteMode('')

        expect(document.getElementById("options-default").classList.contains('hidden')).toBe(false);
        expect(document.getElementById("options-default").classList.contains('shown')).toBe(true);

        expect(document.getElementById("options-delete").classList.contains('hidden')).toBe(true);
        expect(document.getElementById("options-delete").classList.contains('shown')).toBe(false);
    })


    it('testSetDeleteMode', async () => {
        const documentHTML = '<!doctype html><html><body>' +
            '<div id="options-default"></div>' +
            '<div id="options-delete"></div>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        let actual = genericCrudTable.setDeleteMode('')

        expect(document.getElementById("options-default").classList.contains('hidden')).toBe(true);
        expect(document.getElementById("options-default").classList.contains('shown')).toBe(false);

        expect(document.getElementById("options-delete").classList.contains('hidden')).toBe(false);
        expect(document.getElementById("options-delete").classList.contains('shown')).toBe(true);
    })

    it('testGatherUpdates', async () => {
        const table = [{name: 'A_NAME'}];

        const documentHTML = '<!doctype html><html><body>' +
            '<input id="name" value="A_NAME"/>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        let actual = genericCrudTable.gatherUpdates('',table);

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
});

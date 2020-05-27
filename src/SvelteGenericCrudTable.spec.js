import {SvelteGenericCrudTableService} from './SvelteGenericCrudTableService'

const genericCrudTable = new SvelteGenericCrudTableService('', [], []);

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
        genericCrudTable.editable_fields = [toEdit];
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
        genericCrudTable.editable_fields = [toEdit];
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
        const toEdit = 'name';
        genericCrudTable.editable_fields = [toEdit];
        const table = [{name: 'A_NAME'}];

        const documentHTML = '<!doctype html><html><body>' +
            '<input id="name" value="A_NAME"/>' +
            '</body></html>';
        document.body.innerHTML = documentHTML

        let actual = genericCrudTable.gatherUpdates('',table);

        expect(table[0]).toStrictEqual(actual);
    })

    it('testShowField', async () => {
        const toShow = 'name';
        genericCrudTable.show_fields = [{'name': '200px'}];

        let actual = genericCrudTable.showField(toShow);

        expect(actual).toBe(true);
    })

    it('testShowField_noFieldsSet', async () => {
        const toShow = 'name';
        genericCrudTable.show_fields = [];

        let actual = genericCrudTable.showField(toShow);

        expect(actual).toBe(true);
    })


    it('testShowField_dontShow', async () => {
        const toShow = 'name';
        genericCrudTable.show_fields = [{'noName': '200px'}];

        let actual = genericCrudTable.showField(toShow);

        expect(actual).toBe(false);
    })

    it('testShowFieldWidth', async () => {
        const toShow = 'name';
        genericCrudTable.show_fields = [{'name': '200px'}];

        let actual = genericCrudTable.showFieldWidth(toShow);

        expect(actual).toBe('200px');
    })


    it('testShowFieldWidth_noWidth', async () => {
        const toShow = 'name';
        genericCrudTable.show_fields = [{'noName': '200px'}];

        let actual = genericCrudTable.showFieldWidth(toShow);

        expect(actual).toBe('');
    })
});

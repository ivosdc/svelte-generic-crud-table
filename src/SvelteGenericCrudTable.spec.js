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

});

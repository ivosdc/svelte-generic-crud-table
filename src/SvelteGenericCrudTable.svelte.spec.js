import SvelteGenericCrudTable from './SvelteGenericCrudTable.svelte'
import {render, fireEvent} from '@testing-library/svelte'
import {jest} from "@jest/globals";



const table_config = {
    name: 'tableName',
    options: ['EDIT', 'CREATE', 'DETAILS'],
    columns_setting: [
        {name: 'A_FIELD', show: true, edit: true, width: '200px'}
    ]
}

const table_config_delete = {
    name: 'tableName',
    options: ['DELETE'],
    columns_setting: [
        {name: 'A_FIELD', show: true, edit: true, width: '200px'}
    ]
}


describe('Test SvelteGenericCrudTable', () => {

    test('smoke: it should compile and render without throwing', () => {
        const config = {
            table_config: table_config,
            table_data: [{A_FIELD: 'A_FIELDS_VALUE'}]
        };

        expect(() => render(SvelteGenericCrudTable, config)).not.toThrow();
    });


    it('testSvelteGenericCrudTable_tableName', async () => {
        const config = {
            table_config: table_config,
            table_data: [{A_FIELD: 'A_FIELDS_VALUE'}]
        };
        const dom = render(SvelteGenericCrudTable, config)

        const actual = dom.getByDisplayValue('A_FIELDS_VALUE');

        expect(actual.classList.contains('hidden')).toBeTruthy();    })


    it('testSvelteGenericCrudTable_editable_fields', async () => {
        const config = {
            table_config: table_config,
            table_data: [{A_FIELD: 'A_FIELDS_VALUE'}]
        };

        const dom = render(SvelteGenericCrudTable, config)

        const edit = dom.getByTitle('Edit');
        await fireEvent.click(edit);
        const actual = dom.getByDisplayValue('A_FIELDS_VALUE');

        expect(actual.classList.contains('shown')).toBeTruthy();
    })


    it('testSvelteGenericCrudTable_editCancel', async () => {
        const config = {
            table_config: table_config,
            table_data: [{A_FIELD: 'A_FIELDS_VALUE'}]
        };
        const dom = render(SvelteGenericCrudTable, config)

        const edit = dom.getByTitle('Edit');
        await fireEvent.click(edit);
        const actual = dom.getByDisplayValue('A_FIELDS_VALUE');

        expect(actual.classList.contains('shown')).toBeTruthy();

        const cancel = dom.getByTitle('Cancel');
        await fireEvent.click(cancel);

        expect(actual.classList.contains('hidden')).toBeTruthy();
    })

    it('testSvelteGenericCrudTable_editUpdate', async () => {
        const config = {
            table_config: table_config,
            table_data: [{A_FIELD: 'A_FIELDS_VALUE'}]
        };
        const dom = render(SvelteGenericCrudTable, config)

        const editField = dom.getByLabelText(config.table_config.name + `A_FIELD` + 0);
        expect(editField.classList.contains('hidden')).toBeTruthy();


        const edit = dom.getByTitle('Edit');
        await fireEvent.click(edit);

        expect(editField.classList.contains('shown')).toBeTruthy();

        await fireEvent.click(editField);
        editField.value = 'NEW_VALUE';

        const update = dom.getByTitle('Update');
        await fireEvent.click(update);

        expect(config.table_data[0].A_FIELD).toBe('NEW_VALUE');
    })

    it('testSvelteGenericCrudTable_deleteConfirmation', async () => {
        const config = {
            table_config: table_config_delete,
            table_data: [{A_FIELD: 'A_FIELDS_VALUE'}]
        };
        const dom = render(SvelteGenericCrudTable, config)

        const deleteButton = dom.getByLabelText(config.table_config.name + `A_FIELD` + 0 + 'delete');
        await fireEvent.click(deleteButton);

        const deleteConfirmationButton = dom.getByLabelText(config.table_config.name + `A_FIELD` + 0 + 'deleteConfirmation');
        await fireEvent.click(deleteConfirmationButton);

        expect(config.table_data.length).toBe(1);
    })

    it('testSvelteGenericCrudTable_delete_otherDelete_resetOptions', async () => {
        const config = {
            table_config: table_config_delete,
            table_data: [{A_FIELD: 'A_FIELDS_VALUE'}, {A_FIELD: 'A_FIELDS_VALUE'}]
        };
        const dom = render(SvelteGenericCrudTable, config)

        const optionsDefault = dom.getByLabelText(config.table_config.name + `options-default` + 0);
        expect(optionsDefault.classList.contains('shown'))

        const optionsDelete = dom.getByLabelText(config.table_config.name + `options-delete` + 0);
        expect(optionsDelete.classList.contains('hidden'))

        const deleteButton = dom.getByLabelText(config.table_config.name + `A_FIELD` + 0 + 'delete');
        await fireEvent.click(deleteButton);

        expect(optionsDefault.classList.contains('hidden'))
        expect(optionsDelete.classList.contains('shown'))

        const anotherDeleteButton = dom.getByLabelText(config.table_config.name + `A_FIELD` + 1 + 'delete');
        await fireEvent.click(anotherDeleteButton);

        expect(optionsDefault.classList.contains('shown'))
        expect(optionsDelete.classList.contains('hidden'))
    })

    it('testSvelteGenericCrudTable_deleteCancel', async () => {
        const config = {
            table_config: table_config_delete,
            table_data: [{A_FIELD: 'A_FIELDS_VALUE'}]
        };
        const dom = render(SvelteGenericCrudTable, config)

        const deleteButton = dom.getByLabelText(config.table_config.name + `A_FIELD` + 0 + 'delete');
        await fireEvent.click(deleteButton);

        const deleteCancelButton = dom.getByLabelText(config.table_config.name + `A_FIELD` + 0 + 'deleteCancel')
        await fireEvent.click(deleteCancelButton);

        expect(config.table_data.length).toBe(1);
    })

    it('testSvelteGenericCrudTable_handleCreate', async () => {
        const config = {
            table_config: table_config,
            table_data: [{A_FIELD: 'A_FIELDS_VALUE'}]
        };
        SvelteGenericCrudTable.dispatcher = jest.mock;
        const dom = render(SvelteGenericCrudTable, config)

        const edit = dom.getByTitle('Create');
        await fireEvent.click(edit);


        expect(null).toBeNull();
    })

    it('testSvelteGenericCrudTable_handleDetails', async () => {
        const config = {
            table_config: table_config,
            table_data: [{A_FIELD: 'A_FIELDS_VALUE'}]
        };
        const dom = render(SvelteGenericCrudTable, config)

        const edit = dom.getByTitle('Details');
        await fireEvent.click(edit);


        expect(null).toBeNull();
    })

    it('testSvelteGenericCrudTable_handleSort', async () => {
        const config = {
            table_config: table_config,
            table_data: [{A_FIELD: 'A_FIELDS_VALUE'}]
        };

        const dom = render(SvelteGenericCrudTable, config)

        const edit = dom.queryByLabelText('Sort' + 'A_FIELD');
        await fireEvent.click(edit);

        expect(null).toBeNull();
    })

})

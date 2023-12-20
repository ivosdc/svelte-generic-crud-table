import {defaultSort, arrayRemove, clone} from './ArrayService.mjs';
import {describe, test} from "@jest/globals";
import "regenerator-runtime/runtime";

describe('Test ArrayService', () => {

    let mySortStore = [];


    test('defaultSort() ASC', async () => {
        let arr = [{A_COLUMN_NAME: '3'},{A_COLUMN_NAME: '2'},{A_COLUMN_NAME:'4'},{A_COLUMN_NAME:'1'}];
        let actual = defaultSort('A_COLUMN_NAME', mySortStore, arr, 'ASC')

        expect(actual).toEqual([{A_COLUMN_NAME: '1'},{A_COLUMN_NAME: '2'},{A_COLUMN_NAME:'3'},{A_COLUMN_NAME:'4'}]);
    })

    test('defaultSort() DESC', async () => {
        let arr = [{A_COLUMN_NAME: '3'},{A_COLUMN_NAME: '2'},{A_COLUMN_NAME:'4'},{A_COLUMN_NAME:'1'},{A_COLUMN_NAME:'4'}];
        let actual = defaultSort('A_COLUMN_NAME', mySortStore, arr, 'DESC')

        expect(actual).toEqual([{A_COLUMN_NAME:'4'},{A_COLUMN_NAME: '4'},{A_COLUMN_NAME: '3'},{A_COLUMN_NAME:'2'},{A_COLUMN_NAME:'1'}]);
    })

    test('defaultSort() undefined', async () => {
        let arr = [{A_COLUMN_NAME: '3'},{A_COLUMN_NAME: '2'},{A_COLUMN_NAME:'4'},{A_COLUMN_NAME:'1'},{A_COLUMN_NAME:'4'}];
        let actual = defaultSort('A_COLUMN_NAME', mySortStore, arr)

        expect(actual).toEqual([{A_COLUMN_NAME: '1'},{A_COLUMN_NAME: '2'},{A_COLUMN_NAME:'3'},{A_COLUMN_NAME:'4'},{A_COLUMN_NAME:'4'}]);
    })

    test('arrayRemove()', async () => {
        let arr = [{A_COLUMN_NAME: '3'},{A_COLUMN_NAME: '2'},{A_COLUMN_NAME:'4'},{A_COLUMN_NAME:'1'}];

        let actual = arrayRemove(arr, 1)

        expect(actual).toEqual([{A_COLUMN_NAME: '3'},{A_COLUMN_NAME:'4'},{A_COLUMN_NAME:'1'}]);
    })

    test('clone()', async () => {
        let arr = [{A_COLUMN_NAME: '3'},{A_COLUMN_NAME: '2'},{A_COLUMN_NAME:'4'},{A_COLUMN_NAME:'1'}];

        let actual = clone(arr)

        expect(actual).toStrictEqual(arr);
        expect(actual === arr).toBeFalsy();
        expect(actual[0] === arr[0]).toBeFalsy();
    })

})

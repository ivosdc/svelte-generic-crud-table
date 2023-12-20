function setOrder(sortStore, column, order) {
    if (order !== undefined) {
        return order;
    } else {
        return (sortStore[column] === undefined || sortStore[column] === 'DESC') ? 'ASC' : 'DESC';
    }
}

export function defaultSort(column, sortStore, arr, order) {
    sortStore[column] = setOrder(sortStore, column, order);

    const tableSort = (a, b) => {
        let res = 0;
            if (a[column] < b[column]) {
                res = -1;
            }
            if (a[column] > b[column]) {
                res = 1;
            }
        if (sortStore[column] === 'DESC') {
            res = res * -1;
        }
        return res;
    };
    return arr.sort(tableSort);
}

export function arrayRemove(arr, value) {
    let temp = clone(arr);
    return temp.filter(function (_ele, i) {
        return i !== value;
    });
}

export function clone(arr) {
    return JSON.parse(JSON.stringify(arr))
}

export default {
	defaultSort,
	arrayRemove,
	clone
};

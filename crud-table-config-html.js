//config crud-table

let table_config = {
    name: 'Awesome',
    options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
    columns_setting: [
        {name: 'id', show: false, edit: true, size: '200px'},
        {name: 'job', show: true, edit: true, size: '200px'},
        {name: 'name', show: true, edit: true, size: '200px'},
        {name: 'private', show: true, edit: false, size: '200px'}
    ]
}

let genericCrudTable = document.querySelector('crud-table');
const sortStore = [];

genericCrudTable.setAttribute('shadowed', 'true');
genericCrudTable.setAttribute('table_config', JSON.stringify(table_config));
genericCrudTable.setAttribute('table_data', JSON.stringify(myData));

genericCrudTable.addEventListener('create', () => {
    console.log('create');
    myData.push({name: 'myName', job: 'code', private: 'not editable'});
    refresh();
});

genericCrudTable.addEventListener('details', (e) => {
    console.log('details');
    console.log(e.detail.body);
});

genericCrudTable.addEventListener('update', (e) => {
    console.log('update');
    console.log(e.detail.body);
    for(let i = 0; i < myData.length; i++) {
        if (JSON.stringify(myData[i]) === JSON.stringify(table_data[e.detail.id])) {
            myData[i] = e.detail.body;
            break;
        }
    }
    refresh();
    refresh_pager();
});

genericCrudTable.addEventListener('delete', (e) => {
    console.log('delete: ' + JSON.stringify(e.detail.body));
    console.log('offset in view:' + e.detail.id);
    for(let i = 0; i < myData.length; i++) {
        if (JSON.stringify(myData[i]) === JSON.stringify(myData[e.detail.id])) {
            myData = arrayRemove(myData, i)
            break;
        }
    }
    refresh();
});

genericCrudTable.addEventListener('sort', (e) => {
    console.log('sort: ' + e.detail.column);
    const column = e.detail.column;
    if (sortStore[column] === undefined || sortStore[column] === 'DESC') {
        sortStore[column] = 'ASC';
    } else {
        sortStore[column] = 'DESC';
    }

    const tableSort = (a, b) => {
        var keyA = a[column];
        var keyB = b[column];
        if (sortStore[column] === 'ASC') {
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
        } else {
            if (keyA < keyB) return 1;
            if (keyA > keyB) return -1;
        }
        return 0;
    };

    myData = myData.sort(tableSort);
    refresh();
});

function refresh() {
    genericCrudTable.setAttribute('table_data', JSON.stringify({}));
    genericCrudTable.setAttribute('table_data', JSON.stringify(myData));
}

function arrayRemove(arr, value) {
    return arr.filter(function (ele, i) {
        return i !== value;
    });
}

//config crud-table

let table_config = {
    name: 'Awesome:',
    options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
    columns_setting: [
        {name: 'name', show: true, edit: true, width: '150px', tooltip: true},
        {name: 'job', show: true, edit: true, width: '150px', description: 'The job'},
        {name: 'private', show: true, edit: true, width: '200px', description: 'your things', tooltip: true},
        {name: 'html', show: true, edit: false, width: '500px', type: 'html', description: 'You can use HTML', tooltip: true}
    ],
    row_settings: {height: '1.3em'}
}

// table-1
let genericCrudTable = document.getElementById('crud-table-1');
const sortStore = [];

genericCrudTable.setAttribute('shadowed', 'true');
genericCrudTable.setAttribute('table_config', JSON.stringify(table_config));
genericCrudTable.setAttribute('table_data', JSON.stringify(myData));

genericCrudTable.addEventListener('create', () => {
    console.log('create');
    myData.unshift({id: Date.now().toString(), name: 'A_NEW', job: 'none', private: 'set hard', html: 'a <b>b</b> <i>c</i>'});
    genericCrudTable.setAttribute('table_data', JSON.stringify(myData));
});

genericCrudTable.addEventListener('details', (e) => {
    console.log('details');
    console.log(e.detail.body);
});

genericCrudTable.addEventListener('update', (e) => {
    console.log('update');
    console.log(e.detail.body);
    for(let i = 0; i < myData.length; i++) {
        if (JSON.stringify(myData[i]) === JSON.stringify(myData[e.detail.id])) {
            myData[i] = e.detail.body;
            break;
        }
    }
    genericCrudTable.setAttribute('table_data', JSON.stringify(myData));
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
    genericCrudTable.setAttribute('table_data', JSON.stringify(myData));
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
    genericCrudTable.setAttribute('table_data', JSON.stringify(myData));
});

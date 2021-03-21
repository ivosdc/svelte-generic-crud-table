//config crud-table

let table_config2 = {
    name: 'SecondGreat',
    options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
    columns_setting: [
        {name: 'name', show: true, edit: true, width: '150px', tooltip: true},
        {name: 'job', show: true, edit: true, width: '150px', description: 'The job'},
        {name: 'private', show: true, edit: true, width: '200px', description: 'your things', tooltip: true},
        {name: 'html', show: true, edit: true, width: '500px', type: 'html', description: 'You can use HTML', tooltip: true}
    ],
    row_settings: {height: '1.3em'}
}

// table-2
let genericCrudTable2 = document.getElementById('crud-table-2');
const sortStore2 = [];

genericCrudTable2.setAttribute('table_config', JSON.stringify(table_config2));
genericCrudTable2.setAttribute('table_data', JSON.stringify(myData));

genericCrudTable2.addEventListener('create', () => {
    console.log('create');
    myData.unshift({id: Date.now().toString(), name: 'A_NEW', job: 'none', private: 'set hard', html: 'a <b>b</b> <i>c</i>'});
    refresh();
});

genericCrudTable2.addEventListener('details', (e) => {
    console.log('details');
    console.log(e.detail.body);
});

genericCrudTable2.addEventListener('update', (e) => {
    console.log('update');
    console.log(e.detail.body);
    for(let i = 0; i < myData.length; i++) {
        if (JSON.stringify(myData[i]) === JSON.stringify(table_data[e.detail.id])) {
            myData[i] = e.detail.body;
            break;
        }
    }
    refresh(genericCrudTable2);
});

genericCrudTable2.addEventListener('delete', (e) => {
    console.log('delete: ' + JSON.stringify(e.detail.body));
    console.log('offset in view:' + e.detail.id);
    for(let i = 0; i < myData.length; i++) {
        if (JSON.stringify(myData[i]) === JSON.stringify(myData[e.detail.id])) {
            myData = arrayRemove(myData, i)
            break;
        }
    }
    refresh(genericCrudTable2);
});

genericCrudTable2.addEventListener('sort', (e) => {
    console.log('sort: ' + e.detail.column);
    const column = e.detail.column;
    if (sortStore2[column] === undefined || sortStore2[column] === 'DESC') {
        sortStore2[column] = 'ASC';
    } else {
        sortStore2[column] = 'DESC';
    }

    const tableSort = (a, b) => {
        var keyA = a[column];
        var keyB = b[column];
        if (sortStore2[column] === 'ASC') {
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
        } else {
            if (keyA < keyB) return 1;
            if (keyA > keyB) return -1;
        }
        return 0;
    };

    myData = myData.sort(tableSort);
    refresh(genericCrudTable2);
});

//config crud-table

let table_config2 = {
    name: 'SecondGreat',
    options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
    columns_setting: [
        {name: 'name', show: true, edit: true, width: '150px', tooltip: true},
        {name: 'job', show: true, edit: true, width: '150px', description: 'The job'},
        {name: 'private', show: true, edit: true, width: '200px', description: 'your things', tooltip: true},
        {name: 'html', show: true, edit: true, width: '150px', type: 'html', description: 'You can use HTML', tooltip: true}
    ],
    row_settings: {height: '1.3em'}
}

// table-2
let genericCrudTable2 = document.getElementById('crud-table-2');

genericCrudTable2.setAttribute('shadowed', 'true');
genericCrudTable2.setAttribute('table_config', JSON.stringify(table_config2));
genericCrudTable2.setAttribute('table_data', JSON.stringify(myData2));

genericCrudTable2.addEventListener('create', () => {
    console.log('create');
    myData2.unshift({id: Date.now().toString(), name: 'A_NEW', job: 'none', private: 'set hard', html: 'a <b>b</b> <i>c</i>'});
    genericCrudTable2.setAttribute('table_data', JSON.stringify(myData2));
});

genericCrudTable2.addEventListener('details', (e) => {
    console.log('details');
    console.log(e.detail.body);
});

genericCrudTable2.addEventListener('update', (e) => {
    console.log('update');
    console.log(e.detail.body);
    for(let i = 0; i < myData2.length; i++) {
        if (JSON.stringify(myData2[i]) === JSON.stringify(table_data[e.detail.id])) {
            myData2[i] = e.detail.body;
            break;
        }
    }
    genericCrudTable2.setAttribute('table_data', JSON.stringify(myData2));
});

genericCrudTable2.addEventListener('delete', (e) => {
    console.log('delete: ' + JSON.stringify(e.detail.body));
    console.log('offset in view:' + e.detail.id);
    for(let i = 0; i < myData2.length; i++) {
        if (JSON.stringify(myData2[i]) === JSON.stringify(myData2[e.detail.id])) {
            myData2 = arrayRemove(myData2, i)
            break;
        }
    }
    genericCrudTable2.setAttribute('table_data', JSON.stringify(myData2));
});

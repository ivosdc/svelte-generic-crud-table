// config table-pager

const pager_config = {
    name: 'crud-table-pager',
    lines: 5,
    steps: [1, 2, 5, 10, 20, 50],
    width: '350px'
}

let table_data = [];

let currentPage = 1;
let maxPages = 1;
let genericTablePager = document.querySelector('table-pager');
genericTablePager.setAttribute('pager_config', JSON.stringify(pager_config))
genericTablePager.setAttribute('pager_data', JSON.stringify(myData))


genericTablePager.addEventListener('newpage', (e) => {
    table_data = e.detail.body;
    currentPage = e.detail.page;
    maxPages = e.detail.pages;
    refresh();
});


function refresh_pager() {
    genericTablePager.setAttribute('pager_data', JSON.stringify(myData));
    if (currentPage > 1) {
        genericTablePager.shadowRoot.getElementById('left').click();
        genericTablePager.shadowRoot.getElementById('right').click();
    } else {
        genericTablePager.shadowRoot.getElementById('right').click();
        genericTablePager.shadowRoot.getElementById('left').click();
    }
}




function refresh(table) {
    table.setAttribute('table_data', JSON.stringify({}));
    table.setAttribute('table_data', JSON.stringify(myData));
}

function arrayRemove(arr, value) {
    return arr.filter(function (ele, i) {
        return i !== value;
    });
}

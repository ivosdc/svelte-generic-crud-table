
function arrayRemove(arr, value) {
    return arr.filter(function (ele, i) {
        return i !== value;
    });
}

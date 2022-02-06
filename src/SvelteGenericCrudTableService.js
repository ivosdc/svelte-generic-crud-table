export class SvelteGenericCrudTableService {

    constructor(table_config, name) {
        this.name = name;
        this.table_config = table_config;
    }

    getKey(elem) {
        return elem[0];
    }

    makeCapitalLead(elem) {
        return elem[0].toUpperCase() + elem.substr(1);
    }

    getValue(elem) {
        return elem[1];
    }

    resetEditMode(id, event) {
        let parentrow = this.getRow(event);
        this.table_config.columns_setting.forEach((toEdit) => {
            let rowEnabled = parentrow.querySelector('#' + this.name + toEdit.name + id);
            let rowDisabled = parentrow.querySelector('#' + this.name + toEdit.name + id + '-disabled');
            if (rowEnabled !== null && rowDisabled !== null) {
                if (this.isEditField(toEdit.name)) {
                    rowEnabled.classList.add("hidden");
                    rowEnabled.classList.remove("shown");
                    rowDisabled.classList.add("shown");
                    rowDisabled.classList.remove("hidden");
                }
            }
        })
        let optionsDefault = parentrow.querySelector('#' + this.name + 'options-default' + id);
        let optionsEdit = parentrow.querySelector('#' + this.name + 'options-edit' + id);
        if (optionsDefault !== null && optionsEdit !== null) {
            optionsDefault.classList.remove('hidden');
            optionsDefault.classList.add('shown');
            optionsEdit.classList.remove('shown');
            optionsEdit.classList.add('hidden');
        }
    }

    resetDeleteMode(id, event) {
        let parentrow = this.getRow(event);
        let optionsDefault = parentrow.querySelector('#' + this.name + 'options-default' + id);
        let optionsDelete = parentrow.querySelector('#' + this.name + 'options-delete' + id);
        if (optionsDefault !== null && optionsDelete !== null) {
            optionsDefault.classList.remove('hidden');
            optionsDefault.classList.add('shown');
            optionsDelete.classList.remove('shown');
            optionsDelete.classList.add('hidden');
        }
    }

    setEditMode(id, event) {
        let parentrow = this.getRow(event);
        this.table_config.columns_setting.forEach((toEdit) => {
            let rowEnabled = parentrow.querySelector('#' + this.name + toEdit.name + id);
            let rowDisabled = parentrow.querySelector('#' + this.name + toEdit.name + id + "-disabled");
            if (rowEnabled !== null && rowDisabled !== null && this.isEditField(toEdit.name)) {
                rowDisabled.classList.add("hidden");
                rowDisabled.classList.remove("shown");
                rowEnabled.classList.add("shown");
                rowEnabled.classList.remove("hidden");
            }
        })
        let optionsDefault = parentrow.querySelector('#' + this.name + 'options-default' + id);
        let optionsEdit = parentrow.querySelector('#' + this.name + 'options-edit' + id);
        if (optionsDefault !== null && optionsEdit !== null) {
            optionsDefault.classList.add('hidden');
            optionsDefault.classList.remove('shown');
            optionsEdit.classList.remove('hidden');
            optionsEdit.classList.add('shown');
        }
    }


    setDeleteMode(id, event) {
        let parentrow = this.getRow(event);
        let optionsDefault = parentrow.querySelector('#' + this.name + 'options-default' + id);
        let optionsDelete = parentrow.querySelector('#' + this.name + 'options-delete' + id);
        if (optionsDefault !== null && optionsDelete !== null) {
            optionsDefault.classList.add('hidden');
            optionsDefault.classList.remove('shown');
            optionsDelete.classList.remove('hidden');
            optionsDelete.classList.add('shown');
        }
    }

    gatherUpdates(id, table, event) {
        let parentrow = this.getRow(event);
        const body = table[id];
        this.table_config.columns_setting.forEach((elem) => {
            let domElement = parentrow.querySelector('#' + this.name + elem.name + id);
            if (elem.show && domElement !== null) {
                    body[elem.name] = domElement.value;
            }
        })
        return body;
    }

    getRow(event) {
        return event.target.closest('.row');
    }

    getTable(event) {
        return event.target.closest('.table');
    }

    resetRawValues(id, table, event) {
        let parentrow = this.getTable(event);
        this.table_config.columns_setting.forEach((elem) => {
            let element = parentrow.querySelector('#' + this.name + elem.name + id);
            if (elem.show && element !== null) {
                element.value = table[id][elem.name];
            }
        })
    }


    isShowField(field) {
        return (this.getColumnSetting('show', field, false) !== undefined) ? this.getColumnSetting('show', field, false) : false;
    }

    isEditField(field) {
        return (this.isShowField(field)) ? this.getColumnSetting('edit', field, false) : false;
    }

    getShowFieldWidth(field) {
        return (this.isShowField(field)) ? this.getColumnSetting('width', field, '100px') : 0;
    }

    getColumnSetting(attr, column, preset) {
        let column_setting = [];
        this.table_config.columns_setting.forEach((elem) => {
            if (elem.name === column) {
                column_setting = elem;
            }
        });

        return (column_setting[attr] !== undefined) ? column_setting[attr] : preset;
    }

    tooltip(event, x, y, text, type) {
        if (text === undefined || text === '') {
            return;
        }
        let element = document.createElement('div');
        let targetElem = event.target;
        element.style.backgroundColor = 'white';
        element.style.width = event.target.width;
        element.style.maxWidth = '25%';
        element.style.padding = '3px'
        element.style.position = 'fixed';
        element.style.border = 'solid 1px black'
        element.style.whiteSpace = 'break-spaces';
        if (type === 'html') {
            element.innerHTML = text;
        } else {
            element.innerText = text;
        }
        element.style.zIndex = (10000).toString();
        targetElem.appendChild(element);
        element.style.top = (event.pageY - window.scrollY - element.clientHeight - y) + 'px';
        element.style.left = (event.pageX - window.scrollX - (element.clientWidth / 2) + x) + 'px';
        targetElem.addEventListener('mouseleave', e => {
            if (element.parentNode === targetElem) {
                targetElem.removeChild(element);
            }
        })
    }

}


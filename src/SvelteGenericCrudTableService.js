export class SvelteGenericCrudTableService {

    constructor(table_config, shadowed) {
        this.name = table_config.name;
        this.table_config = table_config;
        this.shadowed = shadowed;
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


    resetEditMode(id) {
        if (this.shadowed) {
            this.table_config.columns_setting.forEach((toEdit) => {
                if (this.isEditField(toEdit.name)) {
                    document.querySelector('crud-table').shadowRoot.getElementById(this.name + toEdit.name + id)
                        .setAttribute('disabled', 'true');
                }
            })
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.remove('hidden');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.add('shown');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-edit' + id).classList.remove('shown');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-edit' + id).classList.add('hidden');
        } else {
            this.table_config.columns_setting.forEach((toEdit) => {
                if (this.isEditField(toEdit.name)) {
                    document.getElementById(this.name + toEdit.name + id)
                        .setAttribute('disabled', 'true');
                }
            })
            document.getElementById(this.name + 'options-default' + id).classList.remove('hidden');
            document.getElementById(this.name + 'options-default' + id).classList.add('shown');
            document.getElementById(this.name + 'options-edit' + id).classList.remove('shown');
            document.getElementById(this.name + 'options-edit' + id).classList.add('hidden');
        }
    }

    resetDeleteMode(id) {
        if (this.shadowed) {
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.remove('hidden');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.add('shown');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-delete' + id).classList.remove('shown');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-delete' + id).classList.add('hidden');
        } else {
            document.getElementById(this.name + 'options-default' + id).classList.remove('hidden');
            document.getElementById(this.name + 'options-default' + id).classList.add('shown');
            document.getElementById(this.name + 'options-delete' + id).classList.remove('shown');
            document.getElementById(this.name + 'options-delete' + id).classList.add('hidden');
        }
    }

    setEditMode(id) {
        if (this.shadowed) {
            this.table_config.columns_setting.forEach((toEdit) => {
                if (this.isEditField(toEdit.name)) {
                    document.querySelector('crud-table').shadowRoot.getElementById(this.name + toEdit.name + id).removeAttribute("disabled");
                }
            })
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.add('hidden');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.remove('shown');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-edit' + id).classList.remove('hidden');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-edit' + id).classList.add('shown');
        } else {
            this.table_config.columns_setting.forEach((toEdit) => {
                if (this.isEditField(toEdit.name)) {
                    document.getElementById(this.name + toEdit.name + id).removeAttribute("disabled");
                }
            })
            document.getElementById(this.name + 'options-default' + id).classList.add('hidden');
            document.getElementById(this.name + 'options-default' + id).classList.remove('shown');
            document.getElementById(this.name + 'options-edit' + id).classList.remove('hidden');
            document.getElementById(this.name + 'options-edit' + id).classList.add('shown');
        }
    }

    setDeleteMode(id) {
        if (this.shadowed) {
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.add('hidden');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.remove('shown');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-delete' + id).classList.remove('hidden');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-delete' + id).classList.add('shown');
        } else {
            document.getElementById(this.name + 'options-default' + id).classList.add('hidden');
            document.getElementById(this.name + 'options-default' + id).classList.remove('shown');
            document.getElementById(this.name + 'options-delete' + id).classList.remove('hidden');
            document.getElementById(this.name + 'options-delete' + id).classList.add('shown');
        }
    }

    gatherUpdates(id, table) {
        const body = {};
        this.table_config.columns_setting.forEach((elem) => {
            if (this.shadowed) {
                body[elem.name] = document.querySelector('crud-table').shadowRoot
                    .getElementById(this.name + elem.name + id).value;
            } else {
                body[elem.name] = document.getElementById(this.name + elem.name + id).value;
            }
        })
        return body;
    }


    isShowField(field) {
        return (this.getColumnSetting('show', field, false) !== undefined) ? this.getColumnSetting('show', field, false) : false;
    }

    isEditField(field) {
        return (this.isShowField(field)) ? this.getColumnSetting('edit', field, false) : false;
    }

    getShowFieldWidth(field) {
        const width = (this.getColumnSetting('width', field, '100px') !== undefined) ? this.getColumnSetting('width', field, '100px') : '';
        return (this.isShowField(field)) ? width : '';
    }

    getColumnSetting(attr, column, preset) {
        let val = preset;
        let column_setting = {};
        this.table_config.columns_setting.forEach((elem) => {
            if (elem.name === column) {
                column_setting = elem;
            }
        });
        if (column_setting !== {}) {
            val = column_setting[attr];
        }
        return val;
    }
}


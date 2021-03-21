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


    resetEditMode(id, event) {
        let parentrow = event.target.closest('.row');
        this.table_config.columns_setting.forEach((toEdit) => {
            let elemEnabled = parentrow.querySelector('#' + this.name + toEdit.name + id);
            let elemDisabled = parentrow.querySelector('#' + this.name + toEdit.name + id+ '-disabled');
            if (elemEnabled !== null && elemDisabled !== null) {
                if (this.isEditField(toEdit.name)) {
                    elemEnabled.classList.add("hidden");
                    elemEnabled.classList.remove("shown");
                    elemDisabled.classList.add("shown");
                    elemDisabled.classList.remove("hidden");
                }
            }
        })
        let buttonsDefault = parentrow.querySelector('#' + this.name + 'options-default' + id);
        let buttonsEdit = parentrow.querySelector('#' + this.name + 'options-edit' + id);
        if (buttonsDefault !== null && buttonsEdit !== null) {
            buttonsDefault.classList.remove('hidden');
            buttonsDefault.classList.add('shown');
            buttonsEdit.classList.remove('shown');
            buttonsEdit.classList.add('hidden');
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
                    document.querySelector('crud-table').shadowRoot.getElementById(this.name + toEdit.name + id + '-disabled').classList.add("hidden");
                    document.querySelector('crud-table').shadowRoot.getElementById(this.name + toEdit.name + id + '-disabled').classList.remove("shown");
                    document.querySelector('crud-table').shadowRoot.getElementById(this.name + toEdit.name + id).classList.add("shown");
                    document.querySelector('crud-table').shadowRoot.getElementById(this.name + toEdit.name + id).classList.remove("hidden");
                }
            })
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.add('hidden');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.remove('shown');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-edit' + id).classList.remove('hidden');
            document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-edit' + id).classList.add('shown');
        } else {
            this.table_config.columns_setting.forEach((toEdit) => {
                if (this.isEditField(toEdit.name)) {
                    document.getElementById(this.name + toEdit.name + id + "-disabled").classList.add("hidden");
                    document.getElementById(this.name + toEdit.name + id + "-disabled").classList.remove("shown");
                    document.getElementById(this.name + toEdit.name + id).classList.add("shown");
                    document.getElementById(this.name + toEdit.name + id).classList.remove("hidden");
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
        const body = table[id];
        this.table_config.columns_setting.forEach((elem) => {
            if (elem.show) {
                if (this.shadowed) {
                    body[elem.name] = document.querySelector('crud-table').shadowRoot
                        .getElementById(this.name + elem.name + id).value;
                } else {
                    body[elem.name] = document.getElementById(this.name + elem.name + id).value;
                }
            }
        })
        return body;
    }

    resetRawValues(id, table, event) {
        let parentrow = event.target.closest('.row');
        this.table_config.columns_setting.forEach((elem) => {
            if (elem.show) {
                parentrow.querySelector('#' + this.name + elem.name + id).value = table[id][elem.name];
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

}


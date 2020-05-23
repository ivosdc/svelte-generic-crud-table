export class SvelteGenericCrudTableService {

    constructor(name, editable_fields, show_fields){
        this.name = name;
        this.editable_fields = editable_fields;
        this.show_fields = show_fields;
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
        this.editable_fields.forEach((toEdit) => {
            document.getElementById(this.name + toEdit + id).setAttribute("disabled", "true");
        })
        document.getElementById(this.name + 'options-default' + id).classList.remove('hidden');
        document.getElementById(this.name + 'options-default' + id).classList.add('shown');
        document.getElementById(this.name + 'options-edit' + id).classList.remove('shown');
        document.getElementById(this.name + 'options-edit' + id).classList.add('hidden');
    }

    resetDeleteMode(id) {
        document.getElementById(this.name + 'options-default' + id).classList.remove('hidden');
        document.getElementById(this.name + 'options-default' + id).classList.add('shown');
        document.getElementById(this.name + 'options-delete' + id).classList.remove('shown');
        document.getElementById(this.name + 'options-delete' + id).classList.add('hidden');
    }

    setEditMode(id) {
        this.editable_fields.forEach((toEdit) => {
            document.getElementById(this.name + toEdit + id).removeAttribute("disabled");
        })
        document.getElementById(this.name + 'options-default' + id).classList.add('hidden');
        document.getElementById(this.name + 'options-default' + id).classList.remove('shown');
        document.getElementById(this.name + 'options-edit' + id).classList.remove('hidden');
        document.getElementById(this.name + 'options-edit' + id).classList.add('shown');
    }

    setDeleteMode(id) {
        document.getElementById(this.name + 'options-default' + id).classList.add('hidden');
        document.getElementById(this.name + 'options-default' + id).classList.remove('shown');
        document.getElementById(this.name + 'options-delete' + id).classList.remove('hidden');
        document.getElementById(this.name + 'options-delete' + id).classList.add('shown');
    }

    gatherUpdates(id, table) {
        const body = {};
        Object.entries(table[0]).forEach((elem) => {
            body[this.getKey(elem)] = document.getElementById(this.name + this.getKey(elem) + id).value;
        })
        return body;
    }


    isShowField(field) {
        let show = false;
        if (this.show_fields.length === 0) {
            show = true;
        }
        this.show_fields.forEach((showField) => {
            if (Object.keys(showField)[0] === field) {
                show = true;
            }
        });

        return show;
    }

    getShowFieldWidth(field) {
        let width = '';
        this.show_fields.forEach((showField) => {
            if (Object.keys(showField)[0] === field) {
                width = showField[field];
            }
        });

        return width;
    }

}


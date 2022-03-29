function noop() { }
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_style(node, key, value, important) {
    if (value === null) {
        node.style.removeProperty(key);
    }
    else {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
}
function custom_event(type, detail, bubbles = false) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, bubbles, false, detail);
    return e;
}
class HtmlTag {
    constructor() {
        this.e = this.n = null;
    }
    c(html) {
        this.h(html);
    }
    m(html, target, anchor = null) {
        if (!this.e) {
            this.e = element(target.nodeName);
            this.t = target;
            this.c(html);
        }
        this.i(anchor);
    }
    h(html) {
        this.e.innerHTML = html;
        this.n = Array.from(this.e.childNodes);
    }
    i(anchor) {
        for (let i = 0; i < this.n.length; i += 1) {
            insert(this.t, this.n[i], anchor);
        }
    }
    p(html) {
        this.d();
        this.h(html);
        this.i(this.a);
    }
    d() {
        this.n.forEach(detach);
    }
}
function attribute_to_object(attributes) {
    const result = {};
    for (const attribute of attributes) {
        result[attribute.name] = attribute.value;
    }
    return result;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function
function flush() {
    const saved_component = current_component;
    do {
        // first, call beforeUpdate functions
        // and update components
        while (flushidx < dirty_components.length) {
            const component = dirty_components[flushidx];
            flushidx++;
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        flushidx = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
    set_current_component(saved_component);
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}

function destroy_block(block, lookup) {
    block.d(1);
    lookup.delete(block.key);
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(child_ctx, dirty);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    return new_blocks;
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
let SvelteElement;
if (typeof HTMLElement === 'function') {
    SvelteElement = class extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
        }
        connectedCallback() {
            const { on_mount } = this.$$;
            this.$$.on_disconnect = on_mount.map(run).filter(is_function);
            // @ts-ignore todo: improve typings
            for (const key in this.$$.slotted) {
                // @ts-ignore todo: improve typings
                this.appendChild(this.$$.slotted[key]);
            }
        }
        attributeChangedCallback(attr, _oldValue, newValue) {
            this[attr] = newValue;
        }
        disconnectedCallback() {
            run_all(this.$$.on_disconnect);
        }
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            // TODO should this delegate to addEventListener?
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    };
}

class SvelteGenericCrudTableService {

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
        });
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
        });
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
        });
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
        });
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
        element.style.padding = '3px';
        element.style.position = 'fixed';
        element.style.border = 'solid 1px black';
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
        });
    }

}

const icontrash = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32">\n' +
    '<path d="M6 32h20l2-22h-24zM20 4v-4h-8v4h-10v6l2-2h24l2 2v-6h-10zM18 4h-4v-2h4v2z"></path>\n' +
    '</svg>';
const iconedit = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32">\n' +
    '<path d="M12 20l4-2 14-14-2-2-14 14-2 4zM9.041 27.097c-0.989-2.085-2.052-3.149-4.137-4.137l3.097-8.525 4-2.435 12-12h-6l-12 12-6 20 20-6 12-12v-6l-12 12-2.435 4z"></path>\n' +
    '</svg>';
const iconsave = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32">\n' +
    '<path d="M28 0h-28v32h32v-28l-4-4zM16 4h4v8h-4v-8zM28 28h-24v-24h2v10h18v-10h2.343l1.657 1.657v22.343z"></path>\n' +
    '</svg>';
const iconsend = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512">\n' +
    '<path d="M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z"/>\n' +
    '</svg>';
const iconcancel = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32">\n' +
    '<path d="M31.708 25.708c-0-0-0-0-0-0l-9.708-9.708 9.708-9.708c0-0 0-0 0-0 0.105-0.105 0.18-0.227 0.229-0.357 0.133-0.356 0.057-0.771-0.229-1.057l-4.586-4.586c-0.286-0.286-0.702-0.361-1.057-0.229-0.13 0.048-0.252 0.124-0.357 0.228 0 0-0 0-0 0l-9.708 9.708-9.708-9.708c-0-0-0-0-0-0-0.105-0.104-0.227-0.18-0.357-0.228-0.356-0.133-0.771-0.057-1.057 0.229l-4.586 4.586c-0.286 0.286-0.361 0.702-0.229 1.057 0.049 0.13 0.124 0.252 0.229 0.357 0 0 0 0 0 0l9.708 9.708-9.708 9.708c-0 0-0 0-0 0-0.104 0.105-0.18 0.227-0.229 0.357-0.133 0.355-0.057 0.771 0.229 1.057l4.586 4.586c0.286 0.286 0.702 0.361 1.057 0.229 0.13-0.049 0.252-0.124 0.357-0.229 0-0 0-0 0-0l9.708-9.708 9.708 9.708c0 0 0 0 0 0 0.105 0.105 0.227 0.18 0.357 0.229 0.356 0.133 0.771 0.057 1.057-0.229l4.586-4.586c0.286-0.286 0.362-0.702 0.229-1.057-0.049-0.13-0.124-0.252-0.229-0.357z"></path>\n' +
    '</svg>';
const icondetail = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32">\n' +
    '<path d="M14 9.5c0-0.825 0.675-1.5 1.5-1.5h1c0.825 0 1.5 0.675 1.5 1.5v1c0 0.825-0.675 1.5-1.5 1.5h-1c-0.825 0-1.5-0.675-1.5-1.5v-1z"></path>\n' +
    '<path d="M20 24h-8v-2h2v-6h-2v-2h6v8h2z"></path>\n' +
    '<path d="M16 0c-8.837 0-16 7.163-16 16s7.163 16 16 16 16-7.163 16-16-7.163-16-16-16zM16 29c-7.18 0-13-5.82-13-13s5.82-13 13-13 13 5.82 13 13-5.82 13-13 13z"></path>\n' +
    '</svg>';
const iconcreate = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32">\n' +
    '<path d="M31 12h-11v-11c0-0.552-0.448-1-1-1h-6c-0.552 0-1 0.448-1 1v11h-11c-0.552 0-1 0.448-1 1v6c0 0.552 0.448 1 1 1h11v11c0 0.552 0.448 1 1 1h6c0.552 0 1-0.448 1-1v-11h11c0.552 0 1-0.448 1-1v-6c0-0.552-0.448-1-1-1z"></path>\n' +
    '</svg>';

/* src/SvelteGenericCrudTable.svelte generated by Svelte v3.46.4 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[39] = list[i];
	child_ctx[41] = i;
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[42] = list[i];
	child_ctx[44] = i;
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[45] = list[i];
	child_ctx[47] = i;
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[45] = list[i];
	child_ctx[49] = i;
	return child_ctx;
}

// (191:4) {#if (table_data !== undefined)}
function create_if_block(ctx) {
	let show_if = Array.isArray(/*table_data*/ ctx[0]);
	let if_block_anchor;
	let if_block = show_if && create_if_block_1(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*table_data*/ 1) show_if = Array.isArray(/*table_data*/ ctx[0]);

			if (show_if) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_1(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (193:8) {#if Array.isArray(table_data)}
function create_if_block_1(ctx) {
	let div2;
	let div1;
	let t0;
	let div0;
	let show_if = /*options*/ ctx[3].includes(CREATE);
	let t1;
	let each_blocks = [];
	let each1_lookup = new Map();
	let t2;
	let each_value_3 = /*table_config*/ ctx[1].columns_setting;
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	let if_block0 = show_if && create_if_block_12(ctx);
	let each_value = /*table_data*/ ctx[0];
	const get_key = ctx => /*tableRow*/ ctx[39];

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	let if_block1 = /*table_data*/ ctx[0].length === 0 && create_if_block_2();

	return {
		c() {
			div2 = element("div");
			div1 = element("div");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t0 = space();
			div0 = element("div");
			if (if_block0) if_block0.c();
			t1 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t2 = space();
			if (if_block1) if_block1.c();
			attr(div0, "id", "labelOptions");
			attr(div0, "class", "td headline");
			attr(div1, "class", "thead");

			set_style(div1, "max-height", /*table_config*/ ctx[1].row_settings !== undefined && /*table_config*/ ctx[1].row_settings.height !== undefined
			? /*table_config*/ ctx[1].row_settings.height
			: /*table_config_default*/ ctx[5].row_settings.height);

			attr(div2, "class", "table");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div1);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(div1, null);
			}

			append(div1, t0);
			append(div1, div0);
			if (if_block0) if_block0.m(div0, null);
			append(div2, t1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div2, null);
			}

			append(div2, t2);
			if (if_block1) if_block1.m(div2, null);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*genericCrudTableService, table_config, setWidth, startResize, handleResize, stopResize, handleSort*/ 770066) {
				each_value_3 = /*table_config*/ ctx[1].columns_setting;
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_3(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(div1, t0);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_3.length;
			}

			if (dirty[0] & /*options*/ 8) show_if = /*options*/ ctx[3].includes(CREATE);

			if (show_if) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_12(ctx);
					if_block0.c();
					if_block0.m(div0, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty[0] & /*table_config*/ 2) {
				set_style(div1, "max-height", /*table_config*/ ctx[1].row_settings !== undefined && /*table_config*/ ctx[1].row_settings.height !== undefined
				? /*table_config*/ ctx[1].row_settings.height
				: /*table_config_default*/ ctx[5].row_settings.height);
			}

			if (dirty[0] & /*table_data, table_config, table_config_default, name, handleDeleteConfirmation, handleCancelDelete, options, handleCancelEdit, handleEditConfirmation, handleDetails, handleEdit, handleDelete, genericCrudTableService, getWidth, showTooltipByConfig*/ 1323007) {
				each_value = /*table_data*/ ctx[0];
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each1_lookup, div2, destroy_block, create_each_block, t2, get_each_context);
			}

			if (/*table_data*/ ctx[0].length === 0) {
				if (if_block1) ; else {
					if_block1 = create_if_block_2();
					if_block1.c();
					if_block1.m(div2, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d(detaching) {
			if (detaching) detach(div2);
			destroy_each(each_blocks_1, detaching);
			if (if_block0) if_block0.d();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			if (if_block1) if_block1.d();
		}
	};
}

// (198:20) {#each table_config.columns_setting as elem, index}
function create_each_block_3(ctx) {
	let div;
	let span;
	let t_value = /*genericCrudTableService*/ ctx[4].makeCapitalLead(/*elem*/ ctx[45].name) + "";
	let t;
	let span_aria_label_value;
	let div_id_value;
	let div_class_value;
	let div_style_value;
	let mounted;
	let dispose;

	function click_handler(...args) {
		return /*click_handler*/ ctx[22](/*elem*/ ctx[45], ...args);
	}

	function mouseenter_handler(...args) {
		return /*mouseenter_handler*/ ctx[23](/*elem*/ ctx[45], ...args);
	}

	return {
		c() {
			div = element("div");
			span = element("span");
			t = text(t_value);
			attr(span, "aria-label", span_aria_label_value = "Sort" + /*elem*/ ctx[45].name);
			attr(div, "id", div_id_value = /*index*/ ctx[49]);

			attr(div, "class", div_class_value = "td headline " + (/*genericCrudTableService*/ ctx[4].isShowField(/*elem*/ ctx[45].name) === false
			? 'hidden'
			: 'shown'));

			attr(div, "style", div_style_value = /*setWidth*/ ctx[19](/*elem*/ ctx[45], /*index*/ ctx[49]));
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span);
			append(span, t);

			if (!mounted) {
				dispose = [
					listen(span, "click", click_handler),
					listen(span, "mouseenter", mouseenter_handler),
					listen(div, "mousedown", /*startResize*/ ctx[16]),
					listen(div, "mousemove", /*handleResize*/ ctx[15]),
					listen(div, "mouseup", /*stopResize*/ ctx[17])
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty[0] & /*genericCrudTableService, table_config*/ 18 && t_value !== (t_value = /*genericCrudTableService*/ ctx[4].makeCapitalLead(/*elem*/ ctx[45].name) + "")) set_data(t, t_value);

			if (dirty[0] & /*table_config*/ 2 && span_aria_label_value !== (span_aria_label_value = "Sort" + /*elem*/ ctx[45].name)) {
				attr(span, "aria-label", span_aria_label_value);
			}

			if (dirty[0] & /*genericCrudTableService, table_config*/ 18 && div_class_value !== (div_class_value = "td headline " + (/*genericCrudTableService*/ ctx[4].isShowField(/*elem*/ ctx[45].name) === false
			? 'hidden'
			: 'shown'))) {
				attr(div, "class", div_class_value);
			}

			if (dirty[0] & /*table_config*/ 2 && div_style_value !== (div_style_value = /*setWidth*/ ctx[19](/*elem*/ ctx[45], /*index*/ ctx[49]))) {
				attr(div, "style", div_style_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (215:24) {#if options.includes(CREATE)}
function create_if_block_12(ctx) {
	let div;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			attr(div, "class", "options blue");
			attr(div, "title", "Create");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			div.innerHTML = iconcreate;

			if (!mounted) {
				dispose = listen(div, "click", /*handleCreate*/ ctx[12]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

// (231:32) {#if (column_order.name === genericCrudTableService.getKey(elem))}
function create_if_block_10(ctx) {
	let div1;
	let div0;
	let div0_id_value;
	let div0_aria_label_value;
	let t;
	let textarea;
	let textarea_id_value;
	let textarea_aria_label_value;
	let textarea_value_value;
	let div1_id_value;
	let div1_class_value;
	let mounted;
	let dispose;

	function select_block_type(ctx, dirty) {
		if (/*column_order*/ ctx[42].type === 'html') return create_if_block_11;
		return create_else_block_1;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	function mouseenter_handler_1(...args) {
		return /*mouseenter_handler_1*/ ctx[24](/*column_order*/ ctx[42], /*i*/ ctx[41], ...args);
	}

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			if_block.c();
			t = space();
			textarea = element("textarea");
			attr(div0, "id", div0_id_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + '-disabled');
			attr(div0, "class", "td-disabled shown");
			attr(div0, "aria-label", div0_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + '-disabled');
			attr(textarea, "id", textarea_id_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41]);
			attr(textarea, "class", "hidden");
			attr(textarea, "aria-label", textarea_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41]);
			textarea.value = textarea_value_value = /*table_data*/ ctx[0][/*i*/ ctx[41]][/*column_order*/ ctx[42].name];
			attr(div1, "id", div1_id_value = /*j*/ ctx[44] + '-' + tableNameToId(/*table_config*/ ctx[1].name) + '-' + /*k*/ ctx[47]);

			attr(div1, "class", div1_class_value = "td " + (/*genericCrudTableService*/ ctx[4].isShowField(/*column_order*/ ctx[42].name) === false
			? 'hidden'
			: 'shown'));

			attr(div1, "style", /*getWidth*/ ctx[18](/*j*/ ctx[44]));
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			if_block.m(div0, null);
			append(div1, t);
			append(div1, textarea);

			if (!mounted) {
				dispose = listen(div0, "mouseenter", mouseenter_handler_1);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div0, null);
				}
			}

			if (dirty[0] & /*name, table_config, table_data*/ 7 && div0_id_value !== (div0_id_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + '-disabled')) {
				attr(div0, "id", div0_id_value);
			}

			if (dirty[0] & /*name, table_config, table_data*/ 7 && div0_aria_label_value !== (div0_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + '-disabled')) {
				attr(div0, "aria-label", div0_aria_label_value);
			}

			if (dirty[0] & /*name, table_config, table_data*/ 7 && textarea_id_value !== (textarea_id_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41])) {
				attr(textarea, "id", textarea_id_value);
			}

			if (dirty[0] & /*name, table_config, table_data*/ 7 && textarea_aria_label_value !== (textarea_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41])) {
				attr(textarea, "aria-label", textarea_aria_label_value);
			}

			if (dirty[0] & /*table_data, table_config*/ 3 && textarea_value_value !== (textarea_value_value = /*table_data*/ ctx[0][/*i*/ ctx[41]][/*column_order*/ ctx[42].name])) {
				textarea.value = textarea_value_value;
			}

			if (dirty[0] & /*table_config*/ 2 && div1_id_value !== (div1_id_value = /*j*/ ctx[44] + '-' + tableNameToId(/*table_config*/ ctx[1].name) + '-' + /*k*/ ctx[47])) {
				attr(div1, "id", div1_id_value);
			}

			if (dirty[0] & /*genericCrudTableService, table_config*/ 18 && div1_class_value !== (div1_class_value = "td " + (/*genericCrudTableService*/ ctx[4].isShowField(/*column_order*/ ctx[42].name) === false
			? 'hidden'
			: 'shown'))) {
				attr(div1, "class", div1_class_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div1);
			if_block.d();
			mounted = false;
			dispose();
		}
	};
}

// (242:44) {:else}
function create_else_block_1(ctx) {
	let t_value = /*table_data*/ ctx[0][/*i*/ ctx[41]][/*column_order*/ ctx[42].name] + "";
	let t;

	return {
		c() {
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*table_data, table_config*/ 3 && t_value !== (t_value = /*table_data*/ ctx[0][/*i*/ ctx[41]][/*column_order*/ ctx[42].name] + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (240:44) {#if column_order.type === 'html'}
function create_if_block_11(ctx) {
	let html_tag;
	let raw_value = /*table_data*/ ctx[0][/*i*/ ctx[41]][/*column_order*/ ctx[42].name] + "";
	let html_anchor;

	return {
		c() {
			html_tag = new HtmlTag();
			html_anchor = empty();
			html_tag.a = html_anchor;
		},
		m(target, anchor) {
			html_tag.m(raw_value, target, anchor);
			insert(target, html_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*table_data, table_config*/ 3 && raw_value !== (raw_value = /*table_data*/ ctx[0][/*i*/ ctx[41]][/*column_order*/ ctx[42].name] + "")) html_tag.p(raw_value);
		},
		d(detaching) {
			if (detaching) detach(html_anchor);
			if (detaching) html_tag.d();
		}
	};
}

// (252:32) {#if table_config.columns_setting.length - 1 === j && Object.entries(tableRow).length - 1 === k }
function create_if_block_3(ctx) {
	let div3;
	let div0;
	let show_if_4 = /*options*/ ctx[3].includes(DELETE);
	let t0;
	let show_if_3 = /*options*/ ctx[3].includes(EDIT);
	let t1;
	let show_if_2 = /*options*/ ctx[3].includes(DETAILS);
	let div0_id_value;
	let div0_aria_label_value;
	let t2;
	let div1;
	let show_if_1 = /*options*/ ctx[3].includes(EDIT);
	let div1_id_value;
	let t3;
	let div2;
	let show_if = /*options*/ ctx[3].includes(DELETE);
	let div2_id_value;
	let div2_aria_label_value;
	let if_block0 = show_if_4 && create_if_block_9(ctx);
	let if_block1 = show_if_3 && create_if_block_8(ctx);
	let if_block2 = show_if_2 && create_if_block_6(ctx);
	let if_block3 = show_if_1 && create_if_block_5(ctx);
	let if_block4 = show_if && create_if_block_4(ctx);

	return {
		c() {
			div3 = element("div");
			div0 = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			t2 = space();
			div1 = element("div");
			if (if_block3) if_block3.c();
			t3 = space();
			div2 = element("div");
			if (if_block4) if_block4.c();
			attr(div0, "id", div0_id_value = "" + (/*name*/ ctx[2] + "options-default" + /*i*/ ctx[41]));
			attr(div0, "aria-label", div0_aria_label_value = "" + (/*name*/ ctx[2] + "options-default" + /*i*/ ctx[41]));
			attr(div0, "class", "options-field shown");
			attr(div1, "id", div1_id_value = "" + (/*name*/ ctx[2] + "options-edit" + /*i*/ ctx[41]));
			attr(div1, "class", "options-field hidden");
			attr(div2, "id", div2_id_value = "" + (/*name*/ ctx[2] + "options-delete" + /*i*/ ctx[41]));
			attr(div2, "aria-label", div2_aria_label_value = "" + (/*name*/ ctx[2] + "options-delete" + /*i*/ ctx[41]));
			attr(div2, "class", "options-field hidden");
			attr(div3, "class", "td");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div0);
			if (if_block0) if_block0.m(div0, null);
			append(div0, t0);
			if (if_block1) if_block1.m(div0, null);
			append(div0, t1);
			if (if_block2) if_block2.m(div0, null);
			append(div3, t2);
			append(div3, div1);
			if (if_block3) if_block3.m(div1, null);
			append(div3, t3);
			append(div3, div2);
			if (if_block4) if_block4.m(div2, null);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*options*/ 8) show_if_4 = /*options*/ ctx[3].includes(DELETE);

			if (show_if_4) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_9(ctx);
					if_block0.c();
					if_block0.m(div0, t0);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty[0] & /*options*/ 8) show_if_3 = /*options*/ ctx[3].includes(EDIT);

			if (show_if_3) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_8(ctx);
					if_block1.c();
					if_block1.m(div0, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty[0] & /*options*/ 8) show_if_2 = /*options*/ ctx[3].includes(DETAILS);

			if (show_if_2) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block_6(ctx);
					if_block2.c();
					if_block2.m(div0, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (dirty[0] & /*name, table_data*/ 5 && div0_id_value !== (div0_id_value = "" + (/*name*/ ctx[2] + "options-default" + /*i*/ ctx[41]))) {
				attr(div0, "id", div0_id_value);
			}

			if (dirty[0] & /*name, table_data*/ 5 && div0_aria_label_value !== (div0_aria_label_value = "" + (/*name*/ ctx[2] + "options-default" + /*i*/ ctx[41]))) {
				attr(div0, "aria-label", div0_aria_label_value);
			}

			if (dirty[0] & /*options*/ 8) show_if_1 = /*options*/ ctx[3].includes(EDIT);

			if (show_if_1) {
				if (if_block3) {
					if_block3.p(ctx, dirty);
				} else {
					if_block3 = create_if_block_5(ctx);
					if_block3.c();
					if_block3.m(div1, null);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}

			if (dirty[0] & /*name, table_data*/ 5 && div1_id_value !== (div1_id_value = "" + (/*name*/ ctx[2] + "options-edit" + /*i*/ ctx[41]))) {
				attr(div1, "id", div1_id_value);
			}

			if (dirty[0] & /*options*/ 8) show_if = /*options*/ ctx[3].includes(DELETE);

			if (show_if) {
				if (if_block4) {
					if_block4.p(ctx, dirty);
				} else {
					if_block4 = create_if_block_4(ctx);
					if_block4.c();
					if_block4.m(div2, null);
				}
			} else if (if_block4) {
				if_block4.d(1);
				if_block4 = null;
			}

			if (dirty[0] & /*name, table_data*/ 5 && div2_id_value !== (div2_id_value = "" + (/*name*/ ctx[2] + "options-delete" + /*i*/ ctx[41]))) {
				attr(div2, "id", div2_id_value);
			}

			if (dirty[0] & /*name, table_data*/ 5 && div2_aria_label_value !== (div2_aria_label_value = "" + (/*name*/ ctx[2] + "options-delete" + /*i*/ ctx[41]))) {
				attr(div2, "aria-label", div2_aria_label_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div3);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			if (if_block3) if_block3.d();
			if (if_block4) if_block4.d();
		}
	};
}

// (258:44) {#if options.includes(DELETE)}
function create_if_block_9(ctx) {
	let div;
	let div_aria_label_value;
	let mounted;
	let dispose;

	function click_handler_1(...args) {
		return /*click_handler_1*/ ctx[25](/*i*/ ctx[41], ...args);
	}

	return {
		c() {
			div = element("div");
			attr(div, "class", "options red");
			attr(div, "title", "Delete");
			attr(div, "aria-label", div_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + 'delete');
			attr(div, "tabindex", "0");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			div.innerHTML = icontrash;

			if (!mounted) {
				dispose = listen(div, "click", click_handler_1);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty[0] & /*name, table_config, table_data*/ 7 && div_aria_label_value !== (div_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + 'delete')) {
				attr(div, "aria-label", div_aria_label_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

// (266:44) {#if options.includes(EDIT)}
function create_if_block_8(ctx) {
	let div;
	let mounted;
	let dispose;

	function click_handler_2(...args) {
		return /*click_handler_2*/ ctx[26](/*i*/ ctx[41], ...args);
	}

	return {
		c() {
			div = element("div");
			attr(div, "class", "options green");
			attr(div, "title", "Edit");
			attr(div, "tabindex", "0");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			div.innerHTML = iconedit;

			if (!mounted) {
				dispose = listen(div, "click", click_handler_2);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

// (273:44) {#if options.includes(DETAILS)}
function create_if_block_6(ctx) {
	let div;
	let div_title_value;
	let mounted;
	let dispose;

	function select_block_type_1(ctx, dirty) {
		if (/*table_config*/ ctx[1].details_text !== undefined) return create_if_block_7;
		return create_else_block;
	}

	let current_block_type = select_block_type_1(ctx);
	let if_block = current_block_type(ctx);

	function click_handler_3(...args) {
		return /*click_handler_3*/ ctx[27](/*i*/ ctx[41], ...args);
	}

	return {
		c() {
			div = element("div");
			if_block.c();
			attr(div, "class", "options blue");

			attr(div, "title", div_title_value = /*table_config*/ ctx[1].details_text !== undefined
			? /*table_config*/ ctx[1].details_text
			: 'Details');

			attr(div, "tabindex", "0");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if_block.m(div, null);

			if (!mounted) {
				dispose = listen(div, "click", click_handler_3);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div, null);
				}
			}

			if (dirty[0] & /*table_config*/ 2 && div_title_value !== (div_title_value = /*table_config*/ ctx[1].details_text !== undefined
			? /*table_config*/ ctx[1].details_text
			: 'Details')) {
				attr(div, "title", div_title_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			if_block.d();
			mounted = false;
			dispose();
		}
	};
}

// (279:52) {:else}
function create_else_block(ctx) {
	let html_tag;
	let html_anchor;

	return {
		c() {
			html_tag = new HtmlTag();
			html_anchor = empty();
			html_tag.a = html_anchor;
		},
		m(target, anchor) {
			html_tag.m(icondetail, target, anchor);
			insert(target, html_anchor, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(html_anchor);
			if (detaching) html_tag.d();
		}
	};
}

// (277:52) {#if table_config.details_text !== undefined}
function create_if_block_7(ctx) {
	let t_value = /*table_config*/ ctx[1].details_text + "";
	let t;

	return {
		c() {
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*table_config*/ 2 && t_value !== (t_value = /*table_config*/ ctx[1].details_text + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (288:44) {#if options.includes(EDIT)}
function create_if_block_5(ctx) {
	let div0;
	let t;
	let div1;
	let div1_aria_label_value;
	let mounted;
	let dispose;

	function click_handler_4(...args) {
		return /*click_handler_4*/ ctx[28](/*i*/ ctx[41], ...args);
	}

	function click_handler_5(...args) {
		return /*click_handler_5*/ ctx[29](/*i*/ ctx[41], ...args);
	}

	return {
		c() {
			div0 = element("div");
			t = space();
			div1 = element("div");
			attr(div0, "class", "options green");
			attr(div0, "title", "Update");
			attr(div0, "tabindex", "0");
			attr(div1, "class", "options red");
			attr(div1, "title", "Cancel");
			attr(div1, "aria-label", div1_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + 'editCancel');
			attr(div1, "tabindex", "0");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			div0.innerHTML = iconsave;
			insert(target, t, anchor);
			insert(target, div1, anchor);
			div1.innerHTML = iconcancel;

			if (!mounted) {
				dispose = [
					listen(div0, "click", click_handler_4),
					listen(div1, "click", click_handler_5)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty[0] & /*name, table_config, table_data*/ 7 && div1_aria_label_value !== (div1_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + 'editCancel')) {
				attr(div1, "aria-label", div1_aria_label_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div0);
			if (detaching) detach(t);
			if (detaching) detach(div1);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (306:44) {#if options.includes(DELETE)}
function create_if_block_4(ctx) {
	let div0;
	let div0_aria_label_value;
	let t;
	let div1;
	let div1_aria_label_value;
	let mounted;
	let dispose;

	function click_handler_6(...args) {
		return /*click_handler_6*/ ctx[30](/*i*/ ctx[41], ...args);
	}

	function click_handler_7(...args) {
		return /*click_handler_7*/ ctx[31](/*i*/ ctx[41], ...args);
	}

	return {
		c() {
			div0 = element("div");
			t = space();
			div1 = element("div");
			attr(div0, "class", "options red");
			attr(div0, "title", "Cancel");
			attr(div0, "aria-label", div0_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + 'deleteCancel');
			attr(div0, "tabindex", "0");
			attr(div1, "class", "options green");
			attr(div1, "title", "Delete");
			attr(div1, "aria-label", div1_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + 'deleteConfirmation');
			attr(div1, "tabindex", "0");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			div0.innerHTML = iconcancel;
			insert(target, t, anchor);
			insert(target, div1, anchor);
			div1.innerHTML = iconsend;

			if (!mounted) {
				dispose = [
					listen(div0, "click", click_handler_6),
					listen(div1, "click", click_handler_7)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty[0] & /*name, table_config, table_data*/ 7 && div0_aria_label_value !== (div0_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + 'deleteCancel')) {
				attr(div0, "aria-label", div0_aria_label_value);
			}

			if (dirty[0] & /*name, table_config, table_data*/ 7 && div1_aria_label_value !== (div1_aria_label_value = /*name*/ ctx[2] + /*column_order*/ ctx[42].name + /*i*/ ctx[41] + 'deleteConfirmation')) {
				attr(div1, "aria-label", div1_aria_label_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div0);
			if (detaching) detach(t);
			if (detaching) detach(div1);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (229:28) {#each Object.entries(tableRow) as elem, k}
function create_each_block_2(ctx) {
	let show_if_1 = /*column_order*/ ctx[42].name === /*genericCrudTableService*/ ctx[4].getKey(/*elem*/ ctx[45]);
	let t;
	let show_if = /*table_config*/ ctx[1].columns_setting.length - 1 === /*j*/ ctx[44] && Object.entries(/*tableRow*/ ctx[39]).length - 1 === /*k*/ ctx[47];
	let if_block1_anchor;
	let if_block0 = show_if_1 && create_if_block_10(ctx);
	let if_block1 = show_if && create_if_block_3(ctx);

	return {
		c() {
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, if_block1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*table_config, genericCrudTableService, table_data*/ 19) show_if_1 = /*column_order*/ ctx[42].name === /*genericCrudTableService*/ ctx[4].getKey(/*elem*/ ctx[45]);

			if (show_if_1) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_10(ctx);
					if_block0.c();
					if_block0.m(t.parentNode, t);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty[0] & /*table_config, table_data*/ 3) show_if = /*table_config*/ ctx[1].columns_setting.length - 1 === /*j*/ ctx[44] && Object.entries(/*tableRow*/ ctx[39]).length - 1 === /*k*/ ctx[47];

			if (show_if) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_3(ctx);
					if_block1.c();
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d(detaching) {
			if (if_block0) if_block0.d(detaching);
			if (detaching) detach(t);
			if (if_block1) if_block1.d(detaching);
			if (detaching) detach(if_block1_anchor);
		}
	};
}

// (228:24) {#each table_config.columns_setting as column_order, j}
function create_each_block_1(ctx) {
	let each_1_anchor;
	let each_value_2 = Object.entries(/*tableRow*/ ctx[39]);
	let each_blocks = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*name, table_data, table_config, handleDeleteConfirmation, handleCancelDelete, options, handleCancelEdit, handleEditConfirmation, handleDetails, handleEdit, handleDelete, genericCrudTableService, getWidth, showTooltipByConfig*/ 1322975) {
				each_value_2 = Object.entries(/*tableRow*/ ctx[39]);
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_2.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (225:16) {#each table_data as tableRow, i (tableRow)}
function create_each_block(key_1, ctx) {
	let div;
	let div_class_value;
	let each_value_1 = /*table_config*/ ctx[1].columns_setting;
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	return {
		key: key_1,
		first: null,
		c() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div, "class", div_class_value = "row " + (/*i*/ ctx[41] % 2 === 0 ? 'dark' : ''));

			set_style(div, "min-height", /*table_config*/ ctx[1].row_settings !== undefined && /*table_config*/ ctx[1].row_settings.height !== undefined
			? /*table_config*/ ctx[1].row_settings.height
			: /*table_config_default*/ ctx[5].row_settings.height);

			this.first = div;
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty[0] & /*table_data, name, table_config, handleDeleteConfirmation, handleCancelDelete, options, handleCancelEdit, handleEditConfirmation, handleDetails, handleEdit, handleDelete, genericCrudTableService, getWidth, showTooltipByConfig*/ 1322975) {
				each_value_1 = /*table_config*/ ctx[1].columns_setting;
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_1.length;
			}

			if (dirty[0] & /*table_data*/ 1 && div_class_value !== (div_class_value = "row " + (/*i*/ ctx[41] % 2 === 0 ? 'dark' : ''))) {
				attr(div, "class", div_class_value);
			}

			if (dirty[0] & /*table_config*/ 2) {
				set_style(div, "min-height", /*table_config*/ ctx[1].row_settings !== undefined && /*table_config*/ ctx[1].row_settings.height !== undefined
				? /*table_config*/ ctx[1].row_settings.height
				: /*table_config_default*/ ctx[5].row_settings.height);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (328:16) {#if table_data.length === 0}
function create_if_block_2(ctx) {
	let br;
	let t0;
	let div;

	return {
		c() {
			br = element("br");
			t0 = space();
			div = element("div");
			div.textContent = "No entries.";
			attr(div, "class", "no-entries");
		},
		m(target, anchor) {
			insert(target, br, anchor);
			insert(target, t0, anchor);
			insert(target, div, anchor);
		},
		d(detaching) {
			if (detaching) detach(br);
			if (detaching) detach(t0);
			if (detaching) detach(div);
		}
	};
}

function create_fragment(ctx) {
	let main;
	let if_block = /*table_data*/ ctx[0] !== undefined && create_if_block(ctx);

	return {
		c() {
			main = element("main");
			if (if_block) if_block.c();
			this.c = noop;
		},
		m(target, anchor) {
			insert(target, main, anchor);
			if (if_block) if_block.m(main, null);
		},
		p(ctx, dirty) {
			if (/*table_data*/ ctx[0] !== undefined) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(main, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(main);
			if (if_block) if_block.d();
		}
	};
}

const EDIT = 'EDIT';
const DELETE = 'DELETE';
const CREATE = 'CREATE';
const DETAILS = 'DETAILS';

function tableNameToId(tableName) {
	return tableName.replace(':', '').replace(' ', '');
}

function instance($$self, $$props, $$invalidate) {
	let { shadowed = false } = $$props;
	const dispatch = createEventDispatcher();

	const table_config_default = {
		name: 'crud-table',
		options: ['CREATE', 'EDIT', 'DELETE', 'DETAILS'],
		columns_setting: [],
		details_text: 'detail',
		row_settings: { height: '1.3em' }
	};

	let { table_data = {} } = $$props;
	let { table_config = table_config_default } = $$props;
	let name = '';
	let options = [];
	const NO_ROW_IN_EDIT_MODE = -1;
	let cursor = NO_ROW_IN_EDIT_MODE;
	let genericCrudTableService = new SvelteGenericCrudTableService(table_config, name);

	function handleEdit(id, event) {
		resetRawInEditMode(id, event);
		cursor = id;

		for (let i = 0; i < table_data.length; i++) {
			genericCrudTableService.resetEditMode(i, event);
		}

		genericCrudTableService.setEditMode(id, event);
	}

	function handleCancelEdit(id, event) {
		genericCrudTableService.resetRawValues(id, table_data, event);
		genericCrudTableService.resetEditMode(id, event);
		genericCrudTableService.resetDeleteMode(id, event);
		cursor = NO_ROW_IN_EDIT_MODE;
	}

	function handleEditConfirmation(id, event) {
		resetRawInEditMode(id, event);
		const body = genericCrudTableService.gatherUpdates(id, table_data, event);
		$$invalidate(0, table_data[id] = body, table_data);
		const details = { id, body };
		genericCrudTableService.resetEditMode(id, event);
		dispatcher('update', details, event);
	}

	function handleDelete(id, event) {
		resetRawInEditMode(id, event);
		genericCrudTableService.resetDeleteMode(id, event);
		cursor = id;
		genericCrudTableService.setDeleteMode(id, event);
	}

	function handleCancelDelete(id, event) {
		genericCrudTableService.resetEditMode(id, event);
		genericCrudTableService.resetDeleteMode(id, event);
	}

	function handleDeleteConfirmation(id, event) {
		const body = genericCrudTableService.gatherUpdates(id, table_data, event);
		const details = { id, body };
		genericCrudTableService.resetDeleteMode(id, event);
		cursor = NO_ROW_IN_EDIT_MODE;
		dispatcher('delete', details, event);
	}

	function handleCreate(event) {
		let details = event.detail;
		dispatcher('create', details, event);
	}

	function dispatcher(name, details, event) {
		/* istanbul ignore next */
		if (shadowed) {
			event.target.dispatchEvent(new CustomEvent(name, { composed: true, detail: details }));
		} else {
			dispatch(name, details);
		}
	}

	function handleDetails(id, event) {
		resetRawInEditMode(id, event);
		const body = genericCrudTableService.gatherUpdates(id, table_data, event);
		const details = { id, body };
		dispatcher('details', details, event);
	}

	function resetRawInEditMode(id, event) {
		if (cursor !== id && cursor !== NO_ROW_IN_EDIT_MODE) {
			handleCancelEdit(cursor, event);
		}
	}

	function handleSort(elem, event) {
		let column = { column: elem };
		dispatcher('sort', column, event);
	}

	const columnsWidth = [];
	const columnsResize = [];

	function handleResize(event) {
		let elem = event.target;

		if (columnsResize[elem.id]) {
			let column;
			let querySelector = '[id^="' + elem.id + '-' + tableNameToId(table_config.name) + '"]';
			column = elem.closest('.table').querySelectorAll(querySelector);
			columnsWidth[elem.id] = elem.offsetWidth - 8 + 'px';

			for (let i = 0; i < column.length; i++) {
				column[i].setAttribute('style', 'width:' + (elem.offsetWidth - 8) + 'px');
			}
		}
	}

	function startResize(event) {
		let elem = event.target;
		columnsResize[elem.id] = true;
	}

	function stopResize(event) {
		let elem = event.target;
		columnsResize[elem.id] = false;
	}

	function getWidth(id) {
		return "width:" + columnsWidth[id] + ";";
	}

	function setWidth(elem, i) {
		if (columnsWidth[i] === undefined) {
			columnsWidth[i] = genericCrudTableService.getShowFieldWidth(elem.name); // incl.px;
		}

		return "width:" + columnsWidth[i] + ";";
	}

	function showTooltipByConfig(event, show, text, type) {
		if (show) {
			genericCrudTableService.tooltip(event, 0, 15, text, type);
		}
	}

	const click_handler = (elem, e) => handleSort(elem.name, e);

	const mouseenter_handler = (elem, e) => {
		genericCrudTableService.tooltip(e, 0, 15, elem.description);
	};

	const mouseenter_handler_1 = (column_order, i, e) => {
		showTooltipByConfig(e, column_order.tooltip, table_data[i][column_order.name], column_order.type);
	};

	const click_handler_1 = (i, e) => handleDelete(i, e);
	const click_handler_2 = (i, e) => handleEdit(i, e);

	const click_handler_3 = (i, e) => {
		handleDetails(i, e);
	};

	const click_handler_4 = (i, e) => {
		handleEditConfirmation(i, e);
	};

	const click_handler_5 = (i, e) => {
		handleCancelEdit(i, e);
	};

	const click_handler_6 = (i, e) => handleCancelDelete(i, e);
	const click_handler_7 = (i, e) => handleDeleteConfirmation(i, e);

	$$self.$$set = $$props => {
		if ('shadowed' in $$props) $$invalidate(21, shadowed = $$props.shadowed);
		if ('table_data' in $$props) $$invalidate(0, table_data = $$props.table_data);
		if ('table_config' in $$props) $$invalidate(1, table_config = $$props.table_config);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*table_data*/ 1) {
			/* istanbul ignore next line */
			$$invalidate(0, table_data = typeof table_data === 'string'
			? JSON.parse(table_data)
			: table_data);
		}

		if ($$self.$$.dirty[0] & /*table_config*/ 2) {
			/* istanbul ignore next line */
			$$invalidate(1, table_config = typeof table_config === 'string'
			? JSON.parse(table_config)
			: table_config);
		}

		if ($$self.$$.dirty[0] & /*table_config*/ 2) {
			$$invalidate(2, name = tableNameToId(table_config.name));
		}

		if ($$self.$$.dirty[0] & /*table_config*/ 2) {
			/* istanbul ignore next line */
			$$invalidate(3, options = typeof table_config.options !== 'undefined'
			? table_config.options
			: []);
		}

		if ($$self.$$.dirty[0] & /*table_config, name*/ 6) {
			$$invalidate(4, genericCrudTableService = new SvelteGenericCrudTableService(table_config, name));
		}
	};

	return [
		table_data,
		table_config,
		name,
		options,
		genericCrudTableService,
		table_config_default,
		handleEdit,
		handleCancelEdit,
		handleEditConfirmation,
		handleDelete,
		handleCancelDelete,
		handleDeleteConfirmation,
		handleCreate,
		handleDetails,
		handleSort,
		handleResize,
		startResize,
		stopResize,
		getWidth,
		setWidth,
		showTooltipByConfig,
		shadowed,
		click_handler,
		mouseenter_handler,
		mouseenter_handler_1,
		click_handler_1,
		click_handler_2,
		click_handler_3,
		click_handler_4,
		click_handler_5,
		click_handler_6,
		click_handler_7
	];
}

class SvelteGenericCrudTable extends SvelteElement {
	constructor(options) {
		super();
		this.shadowRoot.innerHTML = `<style>main{position:inherit;padding-top:0.4em}.no-entries{width:100%;color:#666666;text-align:center}.red:hover{fill:red;fill-opacity:80%}.green:hover{fill:limegreen;fill-opacity:80%}.blue:hover{fill:dodgerblue;fill-opacity:80%}.table{display:inline-grid;text-align:left}.thead{display:inline-flex;padding:0 0 0.4em 0}.row{display:inline-flex;padding:0;margin:0 0 1px;resize:vertical}.dark{background-color:#efefef}.row:hover{background-color:rgba(0, 0, 0, 0.1)}.td{color:#5f5f5f;border:none;border-left:0.1em solid transparent;font-weight:100;padding:0.2em 0 0.1em 0.4em;float:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;resize:none}.td-disabled{vertical-align:middle;color:#5f5f5f;border:none;font-weight:200;float:left;line-height:1em;min-height:1.3em;max-height:1.3em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;width:-moz-available;width:-webkit-fill-available;width:stretch}.headline{cursor:pointer;min-height:1.3em;max-height:1.3em;height:1.3em;font-weight:300;padding:0 0 0.3em 0.4em;margin-bottom:0.3em;resize:horizontal}#labelOptions{width:fit-content;width:-moz-fit-content;resize:none}.options-field{min-height:1.3em;max-height:1.3em;width:fit-content;width:-moz-fit-content;opacity:60%;resize:inherit}.options{float:left;position:relative;width:fit-content;width:-moz-fit-content;height:16px;padding:0.2em 0.4em;cursor:pointer;fill:#999999;color:#666666;line-height:0.9em}.options:hover{color:#333333;text-decoration:underline}.options:focus{border:none;outline:none;opacity:100%}.hidden{display:none}.shown{display:block}textarea{position:relative;resize:vertical;overflow:hidden;width:100%;height:100%;min-height:1.3em;padding:1px 1px;background-color:#ffffff;border:none;font-size:0.95em;font-weight:300;font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;text-overflow:ellipsis;white-space:pre;-webkit-transition:box-shadow 0.3s;border-bottom:0.5px solid #5f5f5f;overflow-y:scroll}textarea:focus{outline:none;font-weight:300;white-space:normal;overflow:auto;padding-top:1px}textarea:not(:focus){height:100%}</style>`;

		init(
			this,
			{
				target: this.shadowRoot,
				props: attribute_to_object(this.attributes),
				customElement: true
			},
			instance,
			create_fragment,
			safe_not_equal,
			{
				shadowed: 21,
				table_data: 0,
				table_config: 1
			},
			null,
			[-1, -1]
		);

		if (options) {
			if (options.target) {
				insert(options.target, this, options.anchor);
			}

			if (options.props) {
				this.$set(options.props);
				flush();
			}
		}
	}

	static get observedAttributes() {
		return ["shadowed", "table_data", "table_config"];
	}

	get shadowed() {
		return this.$$.ctx[21];
	}

	set shadowed(shadowed) {
		this.$$set({ shadowed });
		flush();
	}

	get table_data() {
		return this.$$.ctx[0];
	}

	set table_data(table_data) {
		this.$$set({ table_data });
		flush();
	}

	get table_config() {
		return this.$$.ctx[1];
	}

	set table_config(table_config) {
		this.$$set({ table_config });
		flush();
	}
}

customElements.define("crud-table", SvelteGenericCrudTable);

export { SvelteGenericCrudTable as default };

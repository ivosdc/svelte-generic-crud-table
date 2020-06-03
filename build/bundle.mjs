var SvelteGenericCrudTable = (function () {
    'use strict';

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
        if (text.data !== data)
            text.data = data;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
            mount_component(component, options.target, options.anchor);
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
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
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
            $set() {
                // overridden by instance, if it has props
            }
        };
    }

    class SvelteGenericCrudTableService {

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
                });
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
                });
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
                });
                document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.add('hidden');
                document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-default' + id).classList.remove('shown');
                document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-edit' + id).classList.remove('hidden');
                document.querySelector('crud-table').shadowRoot.getElementById(this.name + 'options-edit' + id).classList.add('shown');
            } else {
                this.table_config.columns_setting.forEach((toEdit) => {
                    if (this.isEditField(toEdit.name)) {
                        document.getElementById(this.name + toEdit.name + id).removeAttribute("disabled");
                    }
                });
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
            Object.entries(table[0]).forEach((elem) => {
                if (this.shadowed) {
                    body[this.getKey(elem)] = document.querySelector('crud-table').shadowRoot.getElementById(this.name + this.getKey(elem) + id).value;
                } else {
                    body[this.getKey(elem)] = document.getElementById(this.name + this.getKey(elem) + id).value;
                }
            });
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

    var icontrash = "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 32 32\">\n<title>Delete</title>\n<path d=\"M6 32h20l2-22h-24zM20 4v-4h-8v4h-10v6l2-2h24l2 2v-6h-10zM18 4h-4v-2h4v2z\"></path>\n</svg>";

    var iconedit = "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 32 32\">\n<title>Edit</title>\n<path d=\"M12 20l4-2 14-14-2-2-14 14-2 4zM9.041 27.097c-0.989-2.085-2.052-3.149-4.137-4.137l3.097-8.525 4-2.435 12-12h-6l-12 12-6 20 20-6 12-12v-6l-12 12-2.435 4z\"></path>\n</svg>";

    var iconsave = "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 32 32\">\n<title>Save</title>\n<path d=\"M28 0h-28v32h32v-28l-4-4zM16 4h4v8h-4v-8zM28 28h-24v-24h2v10h18v-10h2.343l1.657 1.657v22.343z\"></path>\n</svg>";

    var iconsend = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 512 512\"><path d=\"M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z\"/></svg>\n<!--\nFont Awesome Free 5.2.0 by @fontawesome - https://fontawesome.com\nLicense - https://fontawesome.com/license (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)\n-->";

    var iconcancel = "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 32 32\">\n<title>Cancel</title>\n<path d=\"M31.708 25.708c-0-0-0-0-0-0l-9.708-9.708 9.708-9.708c0-0 0-0 0-0 0.105-0.105 0.18-0.227 0.229-0.357 0.133-0.356 0.057-0.771-0.229-1.057l-4.586-4.586c-0.286-0.286-0.702-0.361-1.057-0.229-0.13 0.048-0.252 0.124-0.357 0.228 0 0-0 0-0 0l-9.708 9.708-9.708-9.708c-0-0-0-0-0-0-0.105-0.104-0.227-0.18-0.357-0.228-0.356-0.133-0.771-0.057-1.057 0.229l-4.586 4.586c-0.286 0.286-0.361 0.702-0.229 1.057 0.049 0.13 0.124 0.252 0.229 0.357 0 0 0 0 0 0l9.708 9.708-9.708 9.708c-0 0-0 0-0 0-0.104 0.105-0.18 0.227-0.229 0.357-0.133 0.355-0.057 0.771 0.229 1.057l4.586 4.586c0.286 0.286 0.702 0.361 1.057 0.229 0.13-0.049 0.252-0.124 0.357-0.229 0-0 0-0 0-0l9.708-9.708 9.708 9.708c0 0 0 0 0 0 0.105 0.105 0.227 0.18 0.357 0.229 0.356 0.133 0.771 0.057 1.057-0.229l4.586-4.586c0.286-0.286 0.362-0.702 0.229-1.057-0.049-0.13-0.124-0.252-0.229-0.357z\"></path>\n</svg>";

    var icondetail = "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 32 32\">\n<title>Details</title>\n<path d=\"M14 9.5c0-0.825 0.675-1.5 1.5-1.5h1c0.825 0 1.5 0.675 1.5 1.5v1c0 0.825-0.675 1.5-1.5 1.5h-1c-0.825 0-1.5-0.675-1.5-1.5v-1z\"></path>\n<path d=\"M20 24h-8v-2h2v-6h-2v-2h6v8h2z\"></path>\n<path d=\"M16 0c-8.837 0-16 7.163-16 16s7.163 16 16 16 16-7.163 16-16-7.163-16-16-16zM16 29c-7.18 0-13-5.82-13-13s5.82-13 13-13 13 5.82 13 13-5.82 13-13 13z\"></path>\n</svg>";

    var iconcreate = "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 32 32\">\n<title>Create</title>\n<path d=\"M31 12h-11v-11c0-0.552-0.448-1-1-1h-6c-0.552 0-1 0.448-1 1v11h-11c-0.552 0-1 0.448-1 1v6c0 0.552 0.448 1 1 1h11v11c0 0.552 0.448 1 1 1h6c0.552 0 1-0.448 1-1v-11h11c0.552 0 1-0.448 1-1v-6c0-0.552-0.448-1-1-1z\"></path>\n</svg>";

    /* src/SvelteGenericCrudTable.svelte generated by Svelte v3.22.3 */

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	child_ctx[37] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	child_ctx[34] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	child_ctx[31] = i;
    	return child_ctx;
    }

    // (159:4) {#if (table_data !== undefined)}
    function create_if_block(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty[0] & /*table_data*/ 1) show_if = !!Array.isArray(/*table_data*/ ctx[0]);
    		if (show_if) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx, [-1]);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (264:8) {:else}
    function create_else_block(ctx) {
    	let br;
    	let t0;
    	let t1;

    	return {
    		c() {
    			br = element("br");
    			t0 = text("\n            table: ");
    			t1 = text(/*table_data*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, br, anchor);
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*table_data*/ 1) set_data(t1, /*table_data*/ ctx[0]);
    		},
    		d(detaching) {
    			if (detaching) detach(br);
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    		}
    	};
    }

    // (160:8) {#if Array.isArray(table_data)}
    function create_if_block_1(ctx) {
    	let table;
    	let t;
    	let show_if = /*options*/ ctx[3].includes(CREATE);
    	let if_block_anchor;
    	let each_value = /*table_data*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block = show_if && create_if_block_2(ctx);

    	return {
    		c() {
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			insert(target, table, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			insert(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*table_config, table_data, name, genericCrudTable, handleDeleteConfirmation, handleCancelDelete, options, handleCancelEdit, handleEditConfirmation, handleDetails, handleEdit, handleDelete, handleSort*/ 14335) {
    				each_value = /*table_data*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*options*/ 8) show_if = /*options*/ ctx[3].includes(CREATE);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(table);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (163:20) {#if i === 0}
    function create_if_block_10(ctx) {
    	let tr;
    	let t;
    	let td;
    	let each_value_3 = /*table_config*/ ctx[1].columns_setting;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	return {
    		c() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			td = element("td");
    			td.innerHTML = `<textarea value="" disabled=""></textarea>`;
    			attr(td, "id", "labelOptions");
    			attr(td, "class", "headline");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append(tr, t);
    			append(tr, td);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*genericCrudTable, table_config, handleSort*/ 8210) {
    				each_value_3 = /*table_config*/ ctx[1].columns_setting;
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (165:28) {#each table_config.columns_setting as elem}
    function create_each_block_3(ctx) {
    	let td;
    	let textarea;
    	let textarea_value_value;
    	let td_class_value;
    	let td_width_value;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[21](/*elem*/ ctx[35], ...args);
    	}

    	return {
    		c() {
    			td = element("td");
    			textarea = element("textarea");
    			attr(textarea, "class", "sortable");
    			textarea.value = textarea_value_value = /*genericCrudTable*/ ctx[4].makeCapitalLead(/*elem*/ ctx[35].name);
    			textarea.disabled = true;

    			attr(td, "class", td_class_value = "headline " + (/*genericCrudTable*/ ctx[4].isShowField(/*elem*/ ctx[35].name) === false
    			? "hidden"
    			: "shown"));

    			attr(td, "width", td_width_value = /*genericCrudTable*/ ctx[4].getShowFieldWidth(/*elem*/ ctx[35].name));
    		},
    		m(target, anchor, remount) {
    			insert(target, td, anchor);
    			append(td, textarea);
    			if (remount) dispose();
    			dispose = listen(td, "click", click_handler);
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*genericCrudTable, table_config*/ 18 && textarea_value_value !== (textarea_value_value = /*genericCrudTable*/ ctx[4].makeCapitalLead(/*elem*/ ctx[35].name))) {
    				textarea.value = textarea_value_value;
    			}

    			if (dirty[0] & /*genericCrudTable, table_config*/ 18 && td_class_value !== (td_class_value = "headline " + (/*genericCrudTable*/ ctx[4].isShowField(/*elem*/ ctx[35].name) === false
    			? "hidden"
    			: "shown"))) {
    				attr(td, "class", td_class_value);
    			}

    			if (dirty[0] & /*genericCrudTable, table_config*/ 18 && td_width_value !== (td_width_value = /*genericCrudTable*/ ctx[4].getShowFieldWidth(/*elem*/ ctx[35].name))) {
    				attr(td, "width", td_width_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(td);
    			dispose();
    		}
    	};
    }

    // (181:32) {#if (column_order.name === genericCrudTable.getKey(elem))}
    function create_if_block_9(ctx) {
    	let td;
    	let textarea;
    	let textarea_id_value;
    	let textarea_aria_label_value;
    	let textarea_value_value;
    	let t0;
    	let div;
    	let t1_value = /*genericCrudTable*/ ctx[4].getValue(/*elem*/ ctx[35]) + "";
    	let t1;
    	let div_id_value;
    	let div_aria_label_value;
    	let td_class_value;
    	let td_width_value;

    	return {
    		c() {
    			td = element("td");
    			textarea = element("textarea");
    			t0 = space();
    			div = element("div");
    			t1 = text(t1_value);
    			attr(textarea, "id", textarea_id_value = "" + (/*name*/ ctx[2] + /*column_order*/ ctx[32].name + /*i*/ ctx[31]));
    			attr(textarea, "aria-label", textarea_aria_label_value = "" + (/*name*/ ctx[2] + /*column_order*/ ctx[32].name + /*i*/ ctx[31]));
    			textarea.value = textarea_value_value = /*genericCrudTable*/ ctx[4].getValue(/*elem*/ ctx[35]);
    			textarea.disabled = true;
    			attr(div, "class", "hidden");
    			attr(div, "id", div_id_value = "" + (/*name*/ ctx[2] + /*column_order*/ ctx[32].name + /*i*/ ctx[31] + "copy"));
    			attr(div, "aria-label", div_aria_label_value = "" + (/*name*/ ctx[2] + /*column_order*/ ctx[32].name + /*i*/ ctx[31] + "copy"));

    			attr(td, "class", td_class_value = /*genericCrudTable*/ ctx[4].isShowField(/*column_order*/ ctx[32].name) === false
    			? "hidden"
    			: "shown");

    			attr(td, "width", td_width_value = /*genericCrudTable*/ ctx[4].getShowFieldWidth(/*column_order*/ ctx[32].name));
    		},
    		m(target, anchor) {
    			insert(target, td, anchor);
    			append(td, textarea);
    			append(td, t0);
    			append(td, div);
    			append(div, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*name, table_config*/ 6 && textarea_id_value !== (textarea_id_value = "" + (/*name*/ ctx[2] + /*column_order*/ ctx[32].name + /*i*/ ctx[31]))) {
    				attr(textarea, "id", textarea_id_value);
    			}

    			if (dirty[0] & /*name, table_config*/ 6 && textarea_aria_label_value !== (textarea_aria_label_value = "" + (/*name*/ ctx[2] + /*column_order*/ ctx[32].name + /*i*/ ctx[31]))) {
    				attr(textarea, "aria-label", textarea_aria_label_value);
    			}

    			if (dirty[0] & /*genericCrudTable, table_data*/ 17 && textarea_value_value !== (textarea_value_value = /*genericCrudTable*/ ctx[4].getValue(/*elem*/ ctx[35]))) {
    				textarea.value = textarea_value_value;
    			}

    			if (dirty[0] & /*genericCrudTable, table_data*/ 17 && t1_value !== (t1_value = /*genericCrudTable*/ ctx[4].getValue(/*elem*/ ctx[35]) + "")) set_data(t1, t1_value);

    			if (dirty[0] & /*name, table_config*/ 6 && div_id_value !== (div_id_value = "" + (/*name*/ ctx[2] + /*column_order*/ ctx[32].name + /*i*/ ctx[31] + "copy"))) {
    				attr(div, "id", div_id_value);
    			}

    			if (dirty[0] & /*name, table_config*/ 6 && div_aria_label_value !== (div_aria_label_value = "" + (/*name*/ ctx[2] + /*column_order*/ ctx[32].name + /*i*/ ctx[31] + "copy"))) {
    				attr(div, "aria-label", div_aria_label_value);
    			}

    			if (dirty[0] & /*genericCrudTable, table_config*/ 18 && td_class_value !== (td_class_value = /*genericCrudTable*/ ctx[4].isShowField(/*column_order*/ ctx[32].name) === false
    			? "hidden"
    			: "shown")) {
    				attr(td, "class", td_class_value);
    			}

    			if (dirty[0] & /*genericCrudTable, table_config*/ 18 && td_width_value !== (td_width_value = /*genericCrudTable*/ ctx[4].getShowFieldWidth(/*column_order*/ ctx[32].name))) {
    				attr(td, "width", td_width_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(td);
    		}
    	};
    }

    // (193:32) {#if table_config.columns_setting.length - 1 === j && Object.entries(tableRow).length - 1 === k }
    function create_if_block_3(ctx) {
    	let td;
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
    	let if_block0 = show_if_4 && create_if_block_8(ctx);
    	let if_block1 = show_if_3 && create_if_block_7(ctx);
    	let if_block2 = show_if_2 && create_if_block_6(ctx);
    	let if_block3 = show_if_1 && create_if_block_5(ctx);
    	let if_block4 = show_if && create_if_block_4(ctx);

    	return {
    		c() {
    			td = element("td");
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
    			attr(div0, "id", div0_id_value = "" + (/*name*/ ctx[2] + "options-default" + /*i*/ ctx[31]));
    			attr(div0, "aria-label", div0_aria_label_value = "" + (/*name*/ ctx[2] + "options-default" + /*i*/ ctx[31]));
    			attr(div0, "class", "options-field shown");
    			attr(div1, "id", div1_id_value = "" + (/*name*/ ctx[2] + "options-edit" + /*i*/ ctx[31]));
    			attr(div1, "class", "options-field hidden");
    			attr(div2, "id", div2_id_value = "" + (/*name*/ ctx[2] + "options-delete" + /*i*/ ctx[31]));
    			attr(div2, "aria-label", div2_aria_label_value = "" + (/*name*/ ctx[2] + "options-delete" + /*i*/ ctx[31]));
    			attr(div2, "class", "options-field hidden");
    		},
    		m(target, anchor) {
    			insert(target, td, anchor);
    			append(td, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append(div0, t0);
    			if (if_block1) if_block1.m(div0, null);
    			append(div0, t1);
    			if (if_block2) if_block2.m(div0, null);
    			append(td, t2);
    			append(td, div1);
    			if (if_block3) if_block3.m(div1, null);
    			append(td, t3);
    			append(td, div2);
    			if (if_block4) if_block4.m(div2, null);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*options*/ 8) show_if_4 = /*options*/ ctx[3].includes(DELETE);

    			if (show_if_4) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_8(ctx);
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
    					if_block1 = create_if_block_7(ctx);
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

    			if (dirty[0] & /*name*/ 4 && div0_id_value !== (div0_id_value = "" + (/*name*/ ctx[2] + "options-default" + /*i*/ ctx[31]))) {
    				attr(div0, "id", div0_id_value);
    			}

    			if (dirty[0] & /*name*/ 4 && div0_aria_label_value !== (div0_aria_label_value = "" + (/*name*/ ctx[2] + "options-default" + /*i*/ ctx[31]))) {
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

    			if (dirty[0] & /*name*/ 4 && div1_id_value !== (div1_id_value = "" + (/*name*/ ctx[2] + "options-edit" + /*i*/ ctx[31]))) {
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

    			if (dirty[0] & /*name*/ 4 && div2_id_value !== (div2_id_value = "" + (/*name*/ ctx[2] + "options-delete" + /*i*/ ctx[31]))) {
    				attr(div2, "id", div2_id_value);
    			}

    			if (dirty[0] & /*name*/ 4 && div2_aria_label_value !== (div2_aria_label_value = "" + (/*name*/ ctx[2] + "options-delete" + /*i*/ ctx[31]))) {
    				attr(div2, "aria-label", div2_aria_label_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(td);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    		}
    	};
    }

    // (198:44) {#if options.includes(DELETE)}
    function create_if_block_8(ctx) {
    	let div;
    	let div_aria_label_value;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[22](/*i*/ ctx[31], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "options red");
    			attr(div, "title", "Delete");
    			attr(div, "aria-label", div_aria_label_value = /*name*/ ctx[2] + /*genericCrudTable*/ ctx[4].getKey(/*elem*/ ctx[35]) + /*i*/ ctx[31] + "delete");
    		},
    		m(target, anchor, remount) {
    			insert(target, div, anchor);
    			div.innerHTML = icontrash;
    			if (remount) dispose();
    			dispose = listen(div, "click", click_handler_1);
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*name, genericCrudTable, table_data*/ 21 && div_aria_label_value !== (div_aria_label_value = /*name*/ ctx[2] + /*genericCrudTable*/ ctx[4].getKey(/*elem*/ ctx[35]) + /*i*/ ctx[31] + "delete")) {
    				attr(div, "aria-label", div_aria_label_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			dispose();
    		}
    	};
    }

    // (205:44) {#if options.includes(EDIT)}
    function create_if_block_7(ctx) {
    	let div;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[23](/*i*/ ctx[31], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "options green");
    			attr(div, "title", "Edit");
    		},
    		m(target, anchor, remount) {
    			insert(target, div, anchor);
    			div.innerHTML = iconedit;
    			if (remount) dispose();
    			dispose = listen(div, "click", click_handler_2);
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			dispose();
    		}
    	};
    }

    // (211:44) {#if options.includes(DETAILS)}
    function create_if_block_6(ctx) {
    	let div;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[24](/*i*/ ctx[31], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "options blue");
    			attr(div, "title", "Details");
    		},
    		m(target, anchor, remount) {
    			insert(target, div, anchor);
    			div.innerHTML = icondetail;
    			if (remount) dispose();
    			dispose = listen(div, "click", click_handler_3);
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			dispose();
    		}
    	};
    }

    // (220:44) {#if options.includes(EDIT)}
    function create_if_block_5(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let div1_aria_label_value;
    	let dispose;

    	function click_handler_4(...args) {
    		return /*click_handler_4*/ ctx[25](/*i*/ ctx[31], ...args);
    	}

    	function click_handler_5(...args) {
    		return /*click_handler_5*/ ctx[26](/*i*/ ctx[31], ...args);
    	}

    	return {
    		c() {
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr(div0, "class", "options green");
    			attr(div0, "title", "Update");
    			attr(div1, "class", "options red");
    			attr(div1, "title", "Cancel");
    			attr(div1, "aria-label", div1_aria_label_value = "" + (/*name*/ ctx[2] + /*genericCrudTable*/ ctx[4].getKey(/*elem*/ ctx[35]) + /*i*/ ctx[31] + "editCancel"));
    		},
    		m(target, anchor, remount) {
    			insert(target, div0, anchor);
    			div0.innerHTML = iconsave;
    			insert(target, t, anchor);
    			insert(target, div1, anchor);
    			div1.innerHTML = iconcancel;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen(div0, "click", click_handler_4),
    				listen(div1, "click", click_handler_5)
    			];
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*name, genericCrudTable, table_data*/ 21 && div1_aria_label_value !== (div1_aria_label_value = "" + (/*name*/ ctx[2] + /*genericCrudTable*/ ctx[4].getKey(/*elem*/ ctx[35]) + /*i*/ ctx[31] + "editCancel"))) {
    				attr(div1, "aria-label", div1_aria_label_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			if (detaching) detach(t);
    			if (detaching) detach(div1);
    			run_all(dispose);
    		}
    	};
    }

    // (236:44) {#if options.includes(DELETE)}
    function create_if_block_4(ctx) {
    	let div0;
    	let div0_aria_label_value;
    	let t;
    	let div1;
    	let div1_aria_label_value;
    	let dispose;

    	function click_handler_6(...args) {
    		return /*click_handler_6*/ ctx[27](/*i*/ ctx[31], ...args);
    	}

    	function click_handler_7(...args) {
    		return /*click_handler_7*/ ctx[28](/*i*/ ctx[31], ...args);
    	}

    	return {
    		c() {
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr(div0, "class", "options red");
    			attr(div0, "title", "Cancel");
    			attr(div0, "aria-label", div0_aria_label_value = "" + (/*name*/ ctx[2] + /*genericCrudTable*/ ctx[4].getKey(/*elem*/ ctx[35]) + /*i*/ ctx[31] + "deleteCancel"));
    			attr(div1, "class", "options green");
    			attr(div1, "title", "Delete");
    			attr(div1, "aria-label", div1_aria_label_value = "" + (/*name*/ ctx[2] + /*genericCrudTable*/ ctx[4].getKey(/*elem*/ ctx[35]) + /*i*/ ctx[31] + "deleteConfirmation"));
    		},
    		m(target, anchor, remount) {
    			insert(target, div0, anchor);
    			div0.innerHTML = iconcancel;
    			insert(target, t, anchor);
    			insert(target, div1, anchor);
    			div1.innerHTML = iconsend;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen(div0, "click", click_handler_6),
    				listen(div1, "click", click_handler_7)
    			];
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*name, genericCrudTable, table_data*/ 21 && div0_aria_label_value !== (div0_aria_label_value = "" + (/*name*/ ctx[2] + /*genericCrudTable*/ ctx[4].getKey(/*elem*/ ctx[35]) + /*i*/ ctx[31] + "deleteCancel"))) {
    				attr(div0, "aria-label", div0_aria_label_value);
    			}

    			if (dirty[0] & /*name, genericCrudTable, table_data*/ 21 && div1_aria_label_value !== (div1_aria_label_value = "" + (/*name*/ ctx[2] + /*genericCrudTable*/ ctx[4].getKey(/*elem*/ ctx[35]) + /*i*/ ctx[31] + "deleteConfirmation"))) {
    				attr(div1, "aria-label", div1_aria_label_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			if (detaching) detach(t);
    			if (detaching) detach(div1);
    			run_all(dispose);
    		}
    	};
    }

    // (180:28) {#each Object.entries(tableRow) as elem, k}
    function create_each_block_2(ctx) {
    	let show_if_1 = /*column_order*/ ctx[32].name === /*genericCrudTable*/ ctx[4].getKey(/*elem*/ ctx[35]);
    	let t;
    	let show_if = /*table_config*/ ctx[1].columns_setting.length - 1 === /*j*/ ctx[34] && Object.entries(/*tableRow*/ ctx[29]).length - 1 === /*k*/ ctx[37];
    	let if_block1_anchor;
    	let if_block0 = show_if_1 && create_if_block_9(ctx);
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
    			if (dirty[0] & /*table_config, genericCrudTable, table_data*/ 19) show_if_1 = /*column_order*/ ctx[32].name === /*genericCrudTable*/ ctx[4].getKey(/*elem*/ ctx[35]);

    			if (show_if_1) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_9(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty[0] & /*table_config, table_data*/ 3) show_if = /*table_config*/ ctx[1].columns_setting.length - 1 === /*j*/ ctx[34] && Object.entries(/*tableRow*/ ctx[29]).length - 1 === /*k*/ ctx[37];

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

    // (179:24) {#each table_config.columns_setting as column_order, j}
    function create_each_block_1(ctx) {
    	let each_1_anchor;
    	let each_value_2 = Object.entries(/*tableRow*/ ctx[29]);
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
    			if (dirty[0] & /*name, genericCrudTable, table_data, handleDeleteConfirmation, handleCancelDelete, options, handleCancelEdit, handleEditConfirmation, handleDetails, handleEdit, handleDelete, table_config*/ 6143) {
    				each_value_2 = Object.entries(/*tableRow*/ ctx[29]);
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

    // (162:16) {#each table_data as tableRow, i}
    function create_each_block(ctx) {
    	let t0;
    	let tr;
    	let t1;
    	let if_block = /*i*/ ctx[31] === 0 && create_if_block_10(ctx);
    	let each_value_1 = /*table_config*/ ctx[1].columns_setting;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c() {
    			if (if_block) if_block.c();
    			t0 = space();
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			attr(tr, "class", "row");
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, t0, anchor);
    			insert(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append(tr, t1);
    		},
    		p(ctx, dirty) {
    			if (/*i*/ ctx[31] === 0) if_block.p(ctx, dirty);

    			if (dirty[0] & /*table_data, name, genericCrudTable, handleDeleteConfirmation, handleCancelDelete, options, handleCancelEdit, handleEditConfirmation, handleDetails, handleEdit, handleDelete, table_config*/ 6143) {
    				each_value_1 = /*table_config*/ ctx[1].columns_setting;
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (258:12) {#if options.includes(CREATE)}
    function create_if_block_2(ctx) {
    	let div;
    	let t;
    	let br0;
    	let br1;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			t = space();
    			br0 = element("br");
    			br1 = element("br");
    			attr(div, "class", "options");
    			attr(div, "id", "options-create");
    			attr(div, "title", "Create");
    		},
    		m(target, anchor, remount) {
    			insert(target, div, anchor);
    			div.innerHTML = iconcreate;
    			insert(target, t, anchor);
    			insert(target, br0, anchor);
    			insert(target, br1, anchor);
    			if (remount) dispose();
    			dispose = listen(div, "click", /*handleCreate*/ ctx[11]);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching) detach(t);
    			if (detaching) detach(br0);
    			if (detaching) detach(br1);
    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	let main;
    	let h3;
    	let t0;
    	let t1;
    	let if_block = /*table_data*/ ctx[0] !== undefined && create_if_block(ctx);

    	return {
    		c() {
    			main = element("main");
    			h3 = element("h3");
    			t0 = text(/*name*/ ctx[2]);
    			t1 = space();
    			if (if_block) if_block.c();
    			this.c = noop;
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			append(main, h3);
    			append(h3, t0);
    			append(main, t1);
    			if (if_block) if_block.m(main, null);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*name*/ 4) set_data(t0, /*name*/ ctx[2]);

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

    const EDIT = "EDIT";
    const DELETE = "DELETE";
    const CREATE = "CREATE";
    const DETAILS = "DETAILS";

    function instance($$self, $$props, $$invalidate) {
    	let shadowed = false;

    	if (document.querySelector("crud-table")) {
    		shadowed = true;
    	}

    	const dispatch = createEventDispatcher();

    	const table_config_default = {
    		name: "crud-table",
    		options: ["CREATE", "EDIT", "DELETE", "DETAILS"],
    		columns_setting: []
    	};

    	let { table_data = {} } = $$props;
    	let { table_config = table_config_default } = $$props;
    	let name = "";
    	let options = [];
    	const NO_ROW_IN_EDIT_MODE = -1;
    	let cursor = NO_ROW_IN_EDIT_MODE;
    	let genericCrudTable = new SvelteGenericCrudTableService(table_config, shadowed);

    	function handleEdit(id) {
    		resetRawInEditMode(id);
    		cursor = id;

    		for (let i = 0; i < table_data.length; i++) {
    			genericCrudTable.resetEditMode(i);
    		}

    		genericCrudTable.setEditMode(id);
    	}

    	function handleCancelEdit(id) {
    		Object.entries(table_data[id]).forEach(elem => {
    			if (shadowed) {
    				document.querySelector("crud-table").shadowRoot.getElementById(name + genericCrudTable.getKey(elem) + id).value = document.querySelector("crud-table").shadowRoot.getElementById(name + genericCrudTable.getKey(elem) + id + "copy").innerText;
    			} else {
    				document.getElementById(name + genericCrudTable.getKey(elem) + id).value = document.getElementById(name + genericCrudTable.getKey(elem) + id + "copy").innerText;
    			}
    		});

    		genericCrudTable.resetEditMode(id);
    		genericCrudTable.resetDeleteMode(id);
    		cursor = NO_ROW_IN_EDIT_MODE;
    	}

    	function handleEditConfirmation(id, event) {
    		resetRawInEditMode(id);

    		Object.entries(table_data[id]).forEach(elem => {
    			if (shadowed) {
    				document.querySelector("crud-table").shadowRoot.getElementById(name + genericCrudTable.getKey(elem) + id + "copy").innerText = document.querySelector("crud-table").shadowRoot.getElementById(name + genericCrudTable.getKey(elem) + id).value;
    			} else {
    				document.getElementById(name + genericCrudTable.getKey(elem) + id + "copy").innerText = document.getElementById(name + genericCrudTable.getKey(elem) + id).value;
    			}
    		});

    		const body = genericCrudTable.gatherUpdates(id, table_data);
    		const details = { id, body };
    		genericCrudTable.resetEditMode(id);
    		dispatcher("update", details, event);
    	}

    	function handleDelete(id) {
    		resetRawInEditMode(id);
    		genericCrudTable.resetDeleteMode(id);
    		cursor = id;
    		genericCrudTable.setDeleteMode(id);
    	}

    	function handleCancelDelete(id) {
    		genericCrudTable.resetEditMode(id);
    		genericCrudTable.resetDeleteMode(id);
    	}

    	function handleDeleteConfirmation(id, event) {
    		const body = genericCrudTable.gatherUpdates(id, table_data);
    		const details = { id, body };
    		genericCrudTable.resetDeleteMode(id);
    		cursor = NO_ROW_IN_EDIT_MODE;
    		dispatcher("delete", details, event);
    	}

    	function handleCreate(event) {
    		let details = event.detail;
    		dispatcher("create", details, event);
    	}

    	function dispatcher(name, details, event) {
    		if (shadowed) {
    			event.target.dispatchEvent(new CustomEvent(name, { composed: true, detail: details }));
    		} else {
    			dispatch(name, details);
    		}
    	}

    	function handleDetails(id, event) {
    		resetRawInEditMode(id);
    		const body = genericCrudTable.gatherUpdates(id, table_data);
    		const details = { id, body };
    		dispatcher("details", details, event);
    	}

    	function resetRawInEditMode(id) {
    		if (cursor !== id && cursor !== NO_ROW_IN_EDIT_MODE) {
    			handleCancelEdit(cursor);
    		}
    	}

    	function handleSort(elem, event) {
    		let column = { column: elem };
    		dispatcher("sort", column, event);
    	}

    	const click_handler = (elem, e) => handleSort(elem.name, e);
    	const click_handler_1 = i => handleDelete(i);
    	const click_handler_2 = (i, e) => handleEdit(i);

    	const click_handler_3 = (i, e) => {
    		handleDetails(i, e);
    	};

    	const click_handler_4 = (i, e) => {
    		handleEditConfirmation(i, e);
    	};

    	const click_handler_5 = i => {
    		handleCancelEdit(i);
    	};

    	const click_handler_6 = (i, e) => handleCancelDelete(i);
    	const click_handler_7 = (i, e) => handleDeleteConfirmation(i, e);

    	$$self.$set = $$props => {
    		if ("table_data" in $$props) $$invalidate(0, table_data = $$props.table_data);
    		if ("table_config" in $$props) $$invalidate(1, table_config = $$props.table_config);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*table_data*/ 1) {
    			 $$invalidate(0, table_data = typeof table_data === "string"
    			? JSON.parse(table_data)
    			: table_data);
    		}

    		if ($$self.$$.dirty[0] & /*table_config*/ 2) {
    			 $$invalidate(1, table_config = typeof table_config === "string"
    			? JSON.parse(table_config)
    			: table_config);
    		}

    		if ($$self.$$.dirty[0] & /*table_config*/ 2) {
    			 $$invalidate(2, name = table_config.name);
    		}

    		if ($$self.$$.dirty[0] & /*table_config*/ 2) {
    			 $$invalidate(3, options = typeof table_config.options !== "undefined"
    			? table_config.options
    			: []);
    		}

    		if ($$self.$$.dirty[0] & /*table_config, shadowed*/ 16386) {
    			 $$invalidate(4, genericCrudTable = new SvelteGenericCrudTableService(table_config, shadowed));
    		}
    	};

    	return [
    		table_data,
    		table_config,
    		name,
    		options,
    		genericCrudTable,
    		handleEdit,
    		handleCancelEdit,
    		handleEditConfirmation,
    		handleDelete,
    		handleCancelDelete,
    		handleDeleteConfirmation,
    		handleCreate,
    		handleDetails,
    		handleSort,
    		shadowed,
    		cursor,
    		dispatch,
    		table_config_default,
    		NO_ROW_IN_EDIT_MODE,
    		dispatcher,
    		resetRawInEditMode,
    		click_handler,
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
    		this.shadowRoot.innerHTML = `<style>.red:hover{fill:red;fill-opacity:80%}.green:hover{fill:limegreen;fill-opacity:80%}.blue:hover{fill:dodgerblue;fill-opacity:80%}h3{color:#5f5f5f;font-size:0.85em;font-weight:200;padding-left:0.2em;text-align:left}table{text-align:left;border-collapse:collapse;table-layout:fixed;width:100%}.headline{border-bottom:1px solid #dddddd;cursor:pointer}.sortable{cursor:pointer}tr{padding:0;margin:0}td{color:#5f5f5f;border:none;font-size:0.95em;font-weight:200;padding:1px 0 1px 0.4em;float:left}#labelOptions{color:#aaaaaa;font-weight:100;width:100px}.options-field{min-height:1.3em;min-width:100px;max-width:100px;width:100px;opacity:60%}.options{float:left;position:relative;width:12px;height:12px;padding:0.2em 0.4em;cursor:pointer;opacity:60%}.options:hover{opacity:100%}#options-create{text-align:left;height:1.3em;padding-bottom:1em;max-width:0px}.hidden{display:none}.shown{display:block}.row{margin-top:0px;margin-bottom:1px}.row:hover{background-color:#efefef}textarea{position:relative;resize:none;top:0.1em;width:100%;min-height:1.3em;max-height:2.3em;padding:1px 1px;background-color:#ffffff;border:none;font-size:0.95em;font-weight:300;text-overflow:ellipsis;white-space:pre;overflow:hidden;-webkit-transition:box-shadow 0.3s}textarea:not(:disabled){height:2.3em;min-height:2.3em;border-bottom:0.5px solid #5f5f5f}textarea:disabled{color:#5f5f5f;background-color:inherit;font-size:0.95em;font-weight:200;box-shadow:none;height:1.3em;max-height:1.3em}textarea:focus{outline:none;font-weight:300;white-space:normal;overflow:auto;padding-top:1px}textarea:not(:focus){max-height:1.3em}</style>`;
    		init(this, { target: this.shadowRoot }, instance, create_fragment, safe_not_equal, { table_data: 0, table_config: 1 }, [-1, -1]);

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
    		return ["table_data", "table_config"];
    	}

    	get table_data() {
    		return this.$$.ctx[0];
    	}

    	set table_data(table_data) {
    		this.$set({ table_data });
    		flush();
    	}

    	get table_config() {
    		return this.$$.ctx[1];
    	}

    	set table_config(table_config) {
    		this.$set({ table_config });
    		flush();
    	}
    }

    customElements.define("crud-table", SvelteGenericCrudTable);

    return SvelteGenericCrudTable;

}());

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.GenericCrudTable = factory());
}(this, (function () { 'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
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

    /* node_modules/fa-svelte/src/Icon.svelte generated by Svelte v3.22.3 */

    function create_fragment(ctx) {
    	let svg;
    	let path_1;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path_1 = svg_element("path");
    			this.c = noop;
    			attr(path_1, "fill", "currentColor");
    			attr(path_1, "d", /*path*/ ctx[0]);
    			attr(svg, "aria-hidden", "true");
    			attr(svg, "class", /*classes*/ ctx[1]);
    			attr(svg, "role", "img");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "viewBox", /*viewBox*/ ctx[2]);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path_1);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*path*/ 1) {
    				attr(path_1, "d", /*path*/ ctx[0]);
    			}

    			if (dirty & /*classes*/ 2) {
    				attr(svg, "class", /*classes*/ ctx[1]);
    			}

    			if (dirty & /*viewBox*/ 4) {
    				attr(svg, "viewBox", /*viewBox*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { icon } = $$props;
    	let path = [];
    	let classes = "";
    	let viewBox = "";

    	$$self.$set = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("icon" in $$new_props) $$invalidate(3, icon = $$new_props.icon);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon*/ 8) {
    			 $$invalidate(2, viewBox = "0 0 " + icon.icon[0] + " " + icon.icon[1]);
    		}

    		 $$invalidate(1, classes = "fa-svelte " + ($$props.class ? $$props.class : ""));

    		if ($$self.$$.dirty & /*icon*/ 8) {
    			 $$invalidate(0, path = icon.icon[4]);
    		}
    	};

    	$$props = exclude_internal_props($$props);
    	return [path, classes, viewBox, icon];
    }

    class Icon extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>.fa-svelte{width:1em;height:1em;overflow:visible;display:inline-block}</style>`;
    		init(this, { target: this.shadowRoot }, instance, create_fragment, safe_not_equal, { icon: 3 });

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
    		return ["icon"];
    	}

    	get icon() {
    		return this.$$.ctx[3];
    	}

    	set icon(icon) {
    		this.$set({ icon });
    		flush();
    	}
    }

    var faEdit = {
      prefix: 'fas',
      iconName: 'edit',
      icon: [576, 512, [], "f044", "M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"]
    };
    var faInfo = {
      prefix: 'fas',
      iconName: 'info',
      icon: [192, 512, [], "f129", "M20 424.229h20V279.771H20c-11.046 0-20-8.954-20-20V212c0-11.046 8.954-20 20-20h112c11.046 0 20 8.954 20 20v212.229h20c11.046 0 20 8.954 20 20V492c0 11.046-8.954 20-20 20H20c-11.046 0-20-8.954-20-20v-47.771c0-11.046 8.954-20 20-20zM96 0C56.235 0 24 32.235 24 72s32.235 72 72 72 72-32.235 72-72S135.764 0 96 0z"]
    };
    var faPaperPlane = {
      prefix: 'fas',
      iconName: 'paper-plane',
      icon: [512, 512, [], "f1d8", "M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z"]
    };
    var faPlus = {
      prefix: 'fas',
      iconName: 'plus',
      icon: [448, 512, [], "f067", "M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"]
    };
    var faTimes = {
      prefix: 'fas',
      iconName: 'times',
      icon: [352, 512, [], "f00d", "M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"]
    };
    var faTrash = {
      prefix: 'fas',
      iconName: 'trash',
      icon: [448, 512, [], "f1f8", "M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"]
    };

    class SvelteGenericCrudTableService {

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
            });
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
            });
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
            });
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

    /* src/SvelteGenericCrudTable.svelte generated by Svelte v3.22.3 */

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	child_ctx[39] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	child_ctx[36] = i;
    	return child_ctx;
    }

    // (138:4) {#if (table !== undefined)}
    function create_if_block(ctx) {
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty[0] & /*table*/ 1) show_if = !!Array.isArray(/*table*/ ctx[0]);
    		if (show_if) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx, [-1]);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (235:8) {:else}
    function create_else_block(ctx) {
    	let t_value = JSON.stringify(/*table*/ ctx[0]) + "";
    	let t;

    	return {
    		c() {
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*table*/ 1 && t_value !== (t_value = JSON.stringify(/*table*/ ctx[0]) + "")) set_data(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (139:8) {#if Array.isArray(table)}
    function create_if_block_1(ctx) {
    	let table_1;
    	let t;
    	let show_if = /*options*/ ctx[2].includes(CREATE);
    	let if_block_anchor;
    	let current;
    	let each_value = /*table*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = show_if && create_if_block_2(ctx);

    	return {
    		c() {
    			table_1 = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			insert(target, table_1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table_1, null);
    			}

    			insert(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*table, name, genericCrudTable, handleCancelDelete, iconCancel, handleDeleteConfirmation, iconSend, options, handleCancelEdit, handleEditConfirmation, handleDetails, iconDetail, handleEdit, iconEdit, handleDelete, iconTrash, handleSort*/ 458495) {
    				each_value = /*table*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(table_1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty[0] & /*options*/ 4) show_if = /*options*/ ctx[2].includes(CREATE);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*options*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(table_1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (142:20) {#if i === 0}
    function create_if_block_9(ctx) {
    	let tr;
    	let t;
    	let td;
    	let each_value_2 = Object.keys(/*tableRow*/ ctx[34]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
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
    			if (dirty[0] & /*genericCrudTable, table, handleSort*/ 262657) {
    				each_value_2 = Object.keys(/*tableRow*/ ctx[34]);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (144:28) {#each Object.keys(tableRow) as elem}
    function create_each_block_2(ctx) {
    	let td;
    	let textarea;
    	let textarea_value_value;
    	let td_class_value;
    	let td_width_value;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[26](/*elem*/ ctx[37], ...args);
    	}

    	return {
    		c() {
    			td = element("td");
    			textarea = element("textarea");
    			attr(textarea, "class", "sortable");
    			textarea.value = textarea_value_value = /*genericCrudTable*/ ctx[9].makeCapitalLead(/*elem*/ ctx[37]);
    			textarea.disabled = true;

    			attr(td, "class", td_class_value = "headline " + (/*genericCrudTable*/ ctx[9].isShowField(/*elem*/ ctx[37]) === false
    			? "hidden"
    			: "shown"));

    			attr(td, "width", td_width_value = /*genericCrudTable*/ ctx[9].getShowFieldWidth(/*elem*/ ctx[37]));
    		},
    		m(target, anchor, remount) {
    			insert(target, td, anchor);
    			append(td, textarea);
    			if (remount) dispose();
    			dispose = listen(td, "click", click_handler);
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*table*/ 1 && textarea_value_value !== (textarea_value_value = /*genericCrudTable*/ ctx[9].makeCapitalLead(/*elem*/ ctx[37]))) {
    				textarea.value = textarea_value_value;
    			}

    			if (dirty[0] & /*table*/ 1 && td_class_value !== (td_class_value = "headline " + (/*genericCrudTable*/ ctx[9].isShowField(/*elem*/ ctx[37]) === false
    			? "hidden"
    			: "shown"))) {
    				attr(td, "class", td_class_value);
    			}

    			if (dirty[0] & /*table*/ 1 && td_width_value !== (td_width_value = /*genericCrudTable*/ ctx[9].getShowFieldWidth(/*elem*/ ctx[37]))) {
    				attr(td, "width", td_width_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(td);
    			dispose();
    		}
    	};
    }

    // (169:28) {#if Object.entries(tableRow).length - 1 === j}
    function create_if_block_3(ctx) {
    	let td;
    	let div0;
    	let show_if_4 = /*options*/ ctx[2].includes(DELETE);
    	let t0;
    	let show_if_3 = /*options*/ ctx[2].includes(EDIT);
    	let t1;
    	let show_if_2 = /*options*/ ctx[2].includes(DETAILS);
    	let div0_id_value;
    	let div0_aria_label_value;
    	let t2;
    	let div1;
    	let show_if_1 = /*options*/ ctx[2].includes(EDIT);
    	let div1_id_value;
    	let t3;
    	let div2;
    	let show_if = /*options*/ ctx[2].includes(DELETE);
    	let div2_id_value;
    	let div2_aria_label_value;
    	let current;
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
    			attr(div0, "id", div0_id_value = "" + (/*name*/ ctx[1] + "options-default" + /*i*/ ctx[36]));
    			attr(div0, "aria-label", div0_aria_label_value = "" + (/*name*/ ctx[1] + "options-default" + /*i*/ ctx[36]));
    			attr(div0, "class", "options shown");
    			attr(div1, "id", div1_id_value = "" + (/*name*/ ctx[1] + "options-edit" + /*i*/ ctx[36]));
    			attr(div1, "class", "options hidden");
    			attr(div2, "id", div2_id_value = "" + (/*name*/ ctx[1] + "options-delete" + /*i*/ ctx[36]));
    			attr(div2, "aria-label", div2_aria_label_value = "" + (/*name*/ ctx[1] + "options-delete" + /*i*/ ctx[36]));
    			attr(div2, "class", "options hidden");
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
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*options*/ 4) show_if_4 = /*options*/ ctx[2].includes(DELETE);

    			if (show_if_4) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*options*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_8(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*options*/ 4) show_if_3 = /*options*/ ctx[2].includes(EDIT);

    			if (show_if_3) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*options*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_7(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*options*/ 4) show_if_2 = /*options*/ ctx[2].includes(DETAILS);

    			if (show_if_2) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*options*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_6(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div0, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*name*/ 2 && div0_id_value !== (div0_id_value = "" + (/*name*/ ctx[1] + "options-default" + /*i*/ ctx[36]))) {
    				attr(div0, "id", div0_id_value);
    			}

    			if (!current || dirty[0] & /*name*/ 2 && div0_aria_label_value !== (div0_aria_label_value = "" + (/*name*/ ctx[1] + "options-default" + /*i*/ ctx[36]))) {
    				attr(div0, "aria-label", div0_aria_label_value);
    			}

    			if (dirty[0] & /*options*/ 4) show_if_1 = /*options*/ ctx[2].includes(EDIT);

    			if (show_if_1) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*options*/ 4) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_5(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div1, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*name*/ 2 && div1_id_value !== (div1_id_value = "" + (/*name*/ ctx[1] + "options-edit" + /*i*/ ctx[36]))) {
    				attr(div1, "id", div1_id_value);
    			}

    			if (dirty[0] & /*options*/ 4) show_if = /*options*/ ctx[2].includes(DELETE);

    			if (show_if) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*options*/ 4) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_4(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div2, null);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*name*/ 2 && div2_id_value !== (div2_id_value = "" + (/*name*/ ctx[1] + "options-delete" + /*i*/ ctx[36]))) {
    				attr(div2, "id", div2_id_value);
    			}

    			if (!current || dirty[0] & /*name*/ 2 && div2_aria_label_value !== (div2_aria_label_value = "" + (/*name*/ ctx[1] + "options-delete" + /*i*/ ctx[36]))) {
    				attr(div2, "aria-label", div2_aria_label_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
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

    // (174:40) {#if options.includes(DELETE)}
    function create_if_block_8(ctx) {
    	let div;
    	let div_aria_label_value;
    	let current;
    	let dispose;
    	const icon = new Icon({ props: { icon: /*iconTrash*/ ctx[3] } });

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[27](/*i*/ ctx[36], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			create_component(icon.$$.fragment);
    			attr(div, "class", "options red");
    			attr(div, "title", "Delete");
    			attr(div, "aria-label", div_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "delete"));
    		},
    		m(target, anchor, remount) {
    			insert(target, div, anchor);
    			mount_component(icon, div, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen(div, "click", click_handler_1);
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*name, table*/ 3 && div_aria_label_value !== (div_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "delete"))) {
    				attr(div, "aria-label", div_aria_label_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(icon);
    			dispose();
    		}
    	};
    }

    // (181:40) {#if options.includes(EDIT)}
    function create_if_block_7(ctx) {
    	let div;
    	let current;
    	let dispose;
    	const icon = new Icon({ props: { icon: /*iconEdit*/ ctx[4] } });

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[28](/*i*/ ctx[36], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			create_component(icon.$$.fragment);
    			attr(div, "class", "options green");
    			attr(div, "title", "Edit");
    		},
    		m(target, anchor, remount) {
    			insert(target, div, anchor);
    			mount_component(icon, div, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen(div, "click", click_handler_2);
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(icon);
    			dispose();
    		}
    	};
    }

    // (187:40) {#if options.includes(DETAILS)}
    function create_if_block_6(ctx) {
    	let div;
    	let current;
    	let dispose;
    	const icon = new Icon({ props: { icon: /*iconDetail*/ ctx[7] } });

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[29](/*i*/ ctx[36], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			create_component(icon.$$.fragment);
    			attr(div, "class", "options blue");
    			attr(div, "title", "Details");
    		},
    		m(target, anchor, remount) {
    			insert(target, div, anchor);
    			mount_component(icon, div, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen(div, "click", click_handler_3);
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(icon);
    			dispose();
    		}
    	};
    }

    // (194:40) {#if options.includes(EDIT)}
    function create_if_block_5(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let div1_aria_label_value;
    	let current;
    	let dispose;
    	const icon0 = new Icon({ props: { icon: /*iconSend*/ ctx[5] } });

    	function click_handler_4(...args) {
    		return /*click_handler_4*/ ctx[30](/*i*/ ctx[36], ...args);
    	}

    	const icon1 = new Icon({ props: { icon: /*iconCancel*/ ctx[6] } });

    	function click_handler_5(...args) {
    		return /*click_handler_5*/ ctx[31](/*i*/ ctx[36], ...args);
    	}

    	return {
    		c() {
    			div0 = element("div");
    			create_component(icon0.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(icon1.$$.fragment);
    			attr(div0, "class", "options green");
    			attr(div0, "title", "Update");
    			attr(div1, "class", "options red");
    			attr(div1, "title", "Cancel");
    			attr(div1, "aria-label", div1_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "editCancel"));
    		},
    		m(target, anchor, remount) {
    			insert(target, div0, anchor);
    			mount_component(icon0, div0, null);
    			insert(target, t, anchor);
    			insert(target, div1, anchor);
    			mount_component(icon1, div1, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen(div0, "click", click_handler_4),
    				listen(div1, "click", click_handler_5)
    			];
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*name, table*/ 3 && div1_aria_label_value !== (div1_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "editCancel"))) {
    				attr(div1, "aria-label", div1_aria_label_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			destroy_component(icon0);
    			if (detaching) detach(t);
    			if (detaching) detach(div1);
    			destroy_component(icon1);
    			run_all(dispose);
    		}
    	};
    }

    // (209:40) {#if options.includes(DELETE)}
    function create_if_block_4(ctx) {
    	let div0;
    	let div0_aria_label_value;
    	let t;
    	let div1;
    	let div1_aria_label_value;
    	let current;
    	let dispose;
    	const icon0 = new Icon({ props: { icon: /*iconSend*/ ctx[5] } });

    	function click_handler_6(...args) {
    		return /*click_handler_6*/ ctx[32](/*i*/ ctx[36], ...args);
    	}

    	const icon1 = new Icon({ props: { icon: /*iconCancel*/ ctx[6] } });

    	function click_handler_7(...args) {
    		return /*click_handler_7*/ ctx[33](/*i*/ ctx[36], ...args);
    	}

    	return {
    		c() {
    			div0 = element("div");
    			create_component(icon0.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(icon1.$$.fragment);
    			attr(div0, "class", "options green");
    			attr(div0, "title", "Delete");
    			attr(div0, "aria-label", div0_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "deleteConfirmation"));
    			attr(div1, "class", "options red");
    			attr(div1, "title", "Cancel");
    			attr(div1, "aria-label", div1_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "deleteCancel"));
    		},
    		m(target, anchor, remount) {
    			insert(target, div0, anchor);
    			mount_component(icon0, div0, null);
    			insert(target, t, anchor);
    			insert(target, div1, anchor);
    			mount_component(icon1, div1, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen(div0, "click", click_handler_6),
    				listen(div1, "click", click_handler_7)
    			];
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*name, table*/ 3 && div0_aria_label_value !== (div0_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "deleteConfirmation"))) {
    				attr(div0, "aria-label", div0_aria_label_value);
    			}

    			if (!current || dirty[0] & /*name, table*/ 3 && div1_aria_label_value !== (div1_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "deleteCancel"))) {
    				attr(div1, "aria-label", div1_aria_label_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			destroy_component(icon0);
    			if (detaching) detach(t);
    			if (detaching) detach(div1);
    			destroy_component(icon1);
    			run_all(dispose);
    		}
    	};
    }

    // (158:24) {#each Object.entries(tableRow) as elem, j}
    function create_each_block_1(ctx) {
    	let td;
    	let textarea;
    	let textarea_id_value;
    	let textarea_aria_label_value;
    	let textarea_value_value;
    	let t0;
    	let div;
    	let t1_value = /*genericCrudTable*/ ctx[9].getValue(/*elem*/ ctx[37]) + "";
    	let t1;
    	let div_id_value;
    	let div_aria_label_value;
    	let td_class_value;
    	let td_width_value;
    	let t2;
    	let show_if = Object.entries(/*tableRow*/ ctx[34]).length - 1 === /*j*/ ctx[39];
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block_3(ctx);

    	return {
    		c() {
    			td = element("td");
    			textarea = element("textarea");
    			t0 = space();
    			div = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr(textarea, "id", textarea_id_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36]));
    			attr(textarea, "aria-label", textarea_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36]));
    			textarea.value = textarea_value_value = /*genericCrudTable*/ ctx[9].getValue(/*elem*/ ctx[37]);
    			textarea.disabled = true;
    			attr(div, "class", "hidden");
    			attr(div, "id", div_id_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "copy"));
    			attr(div, "aria-label", div_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "copy"));

    			attr(td, "class", td_class_value = /*genericCrudTable*/ ctx[9].isShowField(/*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37])) === false
    			? "hidden"
    			: "shown");

    			attr(td, "width", td_width_value = /*genericCrudTable*/ ctx[9].getShowFieldWidth(/*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37])));
    		},
    		m(target, anchor) {
    			insert(target, td, anchor);
    			append(td, textarea);
    			append(td, t0);
    			append(td, div);
    			append(div, t1);
    			insert(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*name, table*/ 3 && textarea_id_value !== (textarea_id_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36]))) {
    				attr(textarea, "id", textarea_id_value);
    			}

    			if (!current || dirty[0] & /*name, table*/ 3 && textarea_aria_label_value !== (textarea_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36]))) {
    				attr(textarea, "aria-label", textarea_aria_label_value);
    			}

    			if (!current || dirty[0] & /*table*/ 1 && textarea_value_value !== (textarea_value_value = /*genericCrudTable*/ ctx[9].getValue(/*elem*/ ctx[37]))) {
    				textarea.value = textarea_value_value;
    			}

    			if ((!current || dirty[0] & /*table*/ 1) && t1_value !== (t1_value = /*genericCrudTable*/ ctx[9].getValue(/*elem*/ ctx[37]) + "")) set_data(t1, t1_value);

    			if (!current || dirty[0] & /*name, table*/ 3 && div_id_value !== (div_id_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "copy"))) {
    				attr(div, "id", div_id_value);
    			}

    			if (!current || dirty[0] & /*name, table*/ 3 && div_aria_label_value !== (div_aria_label_value = "" + (/*name*/ ctx[1] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37]) + /*i*/ ctx[36] + "copy"))) {
    				attr(div, "aria-label", div_aria_label_value);
    			}

    			if (!current || dirty[0] & /*table*/ 1 && td_class_value !== (td_class_value = /*genericCrudTable*/ ctx[9].isShowField(/*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37])) === false
    			? "hidden"
    			: "shown")) {
    				attr(td, "class", td_class_value);
    			}

    			if (!current || dirty[0] & /*table*/ 1 && td_width_value !== (td_width_value = /*genericCrudTable*/ ctx[9].getShowFieldWidth(/*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[37])))) {
    				attr(td, "width", td_width_value);
    			}

    			if (dirty[0] & /*table*/ 1) show_if = Object.entries(/*tableRow*/ ctx[34]).length - 1 === /*j*/ ctx[39];

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*table*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(td);
    			if (detaching) detach(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (141:16) {#each table as tableRow, i}
    function create_each_block(ctx) {
    	let t0;
    	let tr;
    	let t1;
    	let current;
    	let if_block = /*i*/ ctx[36] === 0 && create_if_block_9(ctx);
    	let each_value_1 = Object.entries(/*tableRow*/ ctx[34]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

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
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*i*/ ctx[36] === 0) if_block.p(ctx, dirty);

    			if (dirty[0] & /*name, genericCrudTable, table, handleCancelDelete, iconCancel, handleDeleteConfirmation, iconSend, options, handleCancelEdit, handleEditConfirmation, handleDetails, iconDetail, handleEdit, iconEdit, handleDelete, iconTrash*/ 196351) {
    				each_value_1 = Object.entries(/*tableRow*/ ctx[34]);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tr, t1);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (229:12) {#if options.includes(CREATE)}
    function create_if_block_2(ctx) {
    	let div;
    	let t;
    	let br0;
    	let br1;
    	let current;
    	let dispose;
    	const icon = new Icon({ props: { icon: /*iconCreate*/ ctx[8] } });

    	return {
    		c() {
    			div = element("div");
    			create_component(icon.$$.fragment);
    			t = space();
    			br0 = element("br");
    			br1 = element("br");
    			attr(div, "class", "options");
    			attr(div, "id", "options-create");
    			attr(div, "title", "Create");
    		},
    		m(target, anchor, remount) {
    			insert(target, div, anchor);
    			mount_component(icon, div, null);
    			insert(target, t, anchor);
    			insert(target, br0, anchor);
    			insert(target, br1, anchor);
    			current = true;
    			if (remount) dispose();
    			dispose = listen(div, "click", /*handleCreate*/ ctx[16]);
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(icon);
    			if (detaching) detach(t);
    			if (detaching) detach(br0);
    			if (detaching) detach(br1);
    			dispose();
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let main;
    	let current;
    	let if_block = /*table*/ ctx[0] !== undefined && create_if_block(ctx);

    	return {
    		c() {
    			main = element("main");
    			if (if_block) if_block.c();
    			this.c = noop;
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*table*/ ctx[0] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*table*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
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

    function instance$1($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	const sortStore = [];
    	const iconTrash = faTrash;
    	const iconEdit = faEdit;
    	const iconSend = faPaperPlane;
    	const iconCancel = faTimes;
    	const iconDetail = faInfo;
    	const iconCreate = faPlus;
    	let { name = "" } = $$props;
    	let { show_fields = [] } = $$props;
    	let { editable_fields = [] } = $$props;
    	let { table = [] } = $$props;
    	let { options = [] } = $$props;
    	const NO_ROW_IN_EDIT_MODE = -1;
    	let cursor = NO_ROW_IN_EDIT_MODE;
    	const genericCrudTable = new SvelteGenericCrudTableService(name, editable_fields, show_fields);

    	function handleEdit(id) {
    		resetRawInEditMode(id);
    		cursor = id;

    		for (let i = 0; i < table.length; i++) {
    			genericCrudTable.resetEditMode(i);
    		}

    		genericCrudTable.setEditMode(id);
    	}

    	function handleCancelEdit(id) {
    		Object.entries(table[id]).forEach(elem => {
    			document.getElementById(name + genericCrudTable.getKey(elem) + id).value = document.getElementById(name + genericCrudTable.getKey(elem) + id + "copy").innerText;
    		});

    		genericCrudTable.resetEditMode(id);
    		genericCrudTable.resetDeleteMode(id);
    		cursor = NO_ROW_IN_EDIT_MODE;
    	}

    	function handleEditConfirmation(id) {
    		resetRawInEditMode(id);

    		Object.entries(table[id]).forEach(elem => {
    			document.getElementById(name + genericCrudTable.getKey(elem) + id + "copy").innerText = document.getElementById(name + genericCrudTable.getKey(elem) + id).value;
    		});

    		const body = genericCrudTable.gatherUpdates(id, table);
    		dispatch("update", { id, body });
    		genericCrudTable.resetEditMode(id);
    		$$invalidate(0, table);
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

    	function handleDeleteConfirmation(id) {
    		const body = genericCrudTable.gatherUpdates(id, table);
    		dispatch("delete", { id, body });
    		genericCrudTable.resetDeleteMode(id);
    		table.splice(id, 1);
    		cursor = NO_ROW_IN_EDIT_MODE;
    		$$invalidate(0, table);
    	}

    	function handleCreate() {
    		dispatch("create", {});
    	}

    	function handleDetails(id) {
    		resetRawInEditMode(id);
    		const body = genericCrudTable.gatherUpdates(id, table);
    		dispatch("details", { id, body });
    	}

    	function resetRawInEditMode(id) {
    		if (cursor !== id && cursor !== NO_ROW_IN_EDIT_MODE) {
    			handleCancelEdit(cursor);
    		}
    	}

    	function handleSort(elem) {
    		if (sortStore[elem] === undefined || sortStore[elem] === "DESC") {
    			sortStore[elem] = "ASC";
    		} else {
    			sortStore[elem] = "DESC";
    		}

    		const tableSort = (a, b) => {
    			var keyA = a[elem];
    			var keyB = b[elem];

    			if (sortStore[elem] === "ASC") {
    				if (keyA < keyB) return -1;
    				if (keyA > keyB) return 1;
    			} else {
    				if (keyA < keyB) return 1;
    				if (keyA > keyB) return -1;
    			}

    			return 0;
    		};

    		$$invalidate(0, table = table.sort(tableSort));
    	}

    	const click_handler = elem => {
    		handleSort(elem);
    	};

    	const click_handler_1 = i => handleDelete(i);
    	const click_handler_2 = i => handleEdit(i);
    	const click_handler_3 = i => handleDetails(i);
    	const click_handler_4 = i => handleEditConfirmation(i);
    	const click_handler_5 = i => handleCancelEdit(i);
    	const click_handler_6 = i => handleDeleteConfirmation(i);
    	const click_handler_7 = i => handleCancelDelete(i);

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("show_fields" in $$props) $$invalidate(19, show_fields = $$props.show_fields);
    		if ("editable_fields" in $$props) $$invalidate(20, editable_fields = $$props.editable_fields);
    		if ("table" in $$props) $$invalidate(0, table = $$props.table);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	return [
    		table,
    		name,
    		options,
    		iconTrash,
    		iconEdit,
    		iconSend,
    		iconCancel,
    		iconDetail,
    		iconCreate,
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
    		show_fields,
    		editable_fields,
    		sortStore,
    		cursor,
    		dispatch,
    		NO_ROW_IN_EDIT_MODE,
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
    		this.shadowRoot.innerHTML = `<style>.red:hover{color:red}.green:hover{color:limegreen}.blue:hover{color:dodgerblue}table{text-align:left;border-collapse:collapse;table-layout:fixed;width:100%}.headline{border-bottom:1px solid #dddddd;cursor:pointer}.sortable{cursor:pointer}td{color:#5f5f5f;border:none;font-size:0.85em;font-weight:200;padding-left:0.2em;float:left}#labelOptions{color:#aaaaaa;font-weight:100;width:100px}.options{padding:0.2em 0.2em 0em;float:left;min-height:1.3em;font-size:1em;cursor:pointer;opacity:60%}.options:hover{opacity:100%}#options-create{text-align:left;height:1.3em;padding-bottom:1em;max-width:0px}.hidden{display:none}.shown{display:block}.row{margin-top:0px;margin-bottom:1px}.row:hover{background-color:#efefef}textarea{position:relative;resize:none;top:0.4em;width:100%;min-height:1.3em;max-height:1.6em;padding:1px 0px 0px;background-color:#ffffff;border:none;font-size:0.85em;font-weight:300;text-overflow:ellipsis;white-space:pre;overflow:hidden;-webkit-transition:box-shadow 0.3s;transition:box-shadow 0.3s;box-shadow:-6px 6px 0px -5px #aaaaaa, 6px 6px 0px -5px #aaaaaa}textarea:not(:disabled){height:1.6em;min-height:1.6em;padding-left:0.3em}textarea:disabled{color:#5f5f5f;background-color:inherit;font-size:0.85em;font-weight:200;box-shadow:none;height:1.3em;max-height:1.3em}textarea:focus{outline:none;font-weight:300;box-shadow:-6px 6px 0px -5px #5f5f5f, 6px 6px 0px -5px #5f5f5f;white-space:normal;overflow:auto;padding-top:1px}textarea:not(:focus){max-height:1.3em}</style>`;

    		init(
    			this,
    			{ target: this.shadowRoot },
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{
    				name: 1,
    				show_fields: 19,
    				editable_fields: 20,
    				table: 0,
    				options: 2
    			},
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
    		return ["name", "show_fields", "editable_fields", "table", "options"];
    	}

    	get name() {
    		return this.$$.ctx[1];
    	}

    	set name(name) {
    		this.$set({ name });
    		flush();
    	}

    	get show_fields() {
    		return this.$$.ctx[19];
    	}

    	set show_fields(show_fields) {
    		this.$set({ show_fields });
    		flush();
    	}

    	get editable_fields() {
    		return this.$$.ctx[20];
    	}

    	set editable_fields(editable_fields) {
    		this.$set({ editable_fields });
    		flush();
    	}

    	get table() {
    		return this.$$.ctx[0];
    	}

    	set table(table) {
    		this.$set({ table });
    		flush();
    	}

    	get options() {
    		return this.$$.ctx[2];
    	}

    	set options(options) {
    		this.$set({ options });
    		flush();
    	}
    }

    customElements.define("svelte-generic-crud-table", SvelteGenericCrudTable);

    return SvelteGenericCrudTable;

})));

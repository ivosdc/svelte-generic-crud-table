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
    function null_to_empty(value) {
        return value == null ? '' : value;
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
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
    }

    /* node_modules/fa-svelte/src/Icon.svelte generated by Svelte v3.22.3 */

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-p8vizn-style";
    	style.textContent = ".fa-svelte.svelte-p8vizn{width:1em;height:1em;overflow:visible;display:inline-block}";
    	append(document.head, style);
    }

    function create_fragment(ctx) {
    	let svg;
    	let path_1;
    	let svg_class_value;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path_1 = svg_element("path");
    			attr(path_1, "fill", "currentColor");
    			attr(path_1, "d", /*path*/ ctx[0]);
    			attr(svg, "aria-hidden", "true");
    			attr(svg, "class", svg_class_value = "" + (null_to_empty(/*classes*/ ctx[1]) + " svelte-p8vizn"));
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

    			if (dirty & /*classes*/ 2 && svg_class_value !== (svg_class_value = "" + (null_to_empty(/*classes*/ ctx[1]) + " svelte-p8vizn"))) {
    				attr(svg, "class", svg_class_value);
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

    class Icon extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-p8vizn-style")) add_css();
    		init(this, options, instance, create_fragment, safe_not_equal, { icon: 3 });
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


        showField(field) {
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

        showFieldWidth(field) {
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

    const { document: document_1 } = globals;

    function add_css$1() {
    	var style = element("style");
    	style.id = "svelte-a9ek5x-style";
    	style.textContent = ".red.svelte-a9ek5x:hover{color:red}.green.svelte-a9ek5x:hover{color:limegreen}.blue.svelte-a9ek5x:hover{color:dodgerblue}table.svelte-a9ek5x{text-align:left;border-collapse:collapse;table-layout:fixed;width:100%}.headline.svelte-a9ek5x{border-bottom:1px solid #dddddd}td.svelte-a9ek5x{color:#5f5f5f;border:none;font-size:0.85em;font-weight:200;padding-left:0.2em;float:left}#labelOptions.svelte-a9ek5x{color:#aaaaaa;font-weight:100;width:100px}.options.svelte-a9ek5x{padding:0.2em 0.2em 0em;float:left;min-height:1.3em;font-size:1em;cursor:pointer;opacity:60%}.options.svelte-a9ek5x:hover{opacity:100%}#options-create.svelte-a9ek5x{text-align:left;height:1.3em;padding-bottom:1em;max-width:0px}.hidden.svelte-a9ek5x{display:none}.shown.svelte-a9ek5x{display:block}.row.svelte-a9ek5x{margin-top:0px;margin-bottom:1px}.row.svelte-a9ek5x:hover{background-color:#efefef}textarea.svelte-a9ek5x{position:relative;resize:none;top:0.4em;width:100%;min-height:1.3em;max-height:1.6em;padding:1px 0px 0px;background-color:#ffffff;border:none;font-size:0.85em;font-weight:300;text-overflow:ellipsis;white-space:pre;overflow:hidden;-webkit-transition:box-shadow 0.3s;transition:box-shadow 0.3s;box-shadow:-6px 6px 0px -5px #aaaaaa, 6px 6px 0px -5px #aaaaaa}textarea.svelte-a9ek5x:not(:disabled){height:1.6em;min-height:1.6em;padding-left:0.3em}textarea.svelte-a9ek5x:disabled{color:#5f5f5f;background-color:inherit;font-size:0.85em;font-weight:200;box-shadow:none;height:1.3em;max-height:1.3em}textarea.svelte-a9ek5x:focus{outline:none;font-weight:300;box-shadow:-6px 6px 0px -5px #5f5f5f, 6px 6px 0px -5px #5f5f5f;white-space:normal;overflow:auto;padding-top:1px}textarea.svelte-a9ek5x:not(:focus){max-height:1.3em}";
    	append(document_1.head, style);
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	child_ctx[33] = i;
    	return child_ctx;
    }

    // (109:4) {#if (table !== undefined)}
    function create_if_block(ctx) {
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty[0] & /*table*/ 2) show_if = !!Array.isArray(/*table*/ ctx[1]);
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

    // (182:8) {:else}
    function create_else_block(ctx) {
    	let t_value = JSON.stringify(/*table*/ ctx[1]) + "";
    	let t;

    	return {
    		c() {
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*table*/ 2 && t_value !== (t_value = JSON.stringify(/*table*/ ctx[1]) + "")) set_data(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (110:8) {#if Array.isArray(table)}
    function create_if_block_1(ctx) {
    	let table_1;
    	let t;
    	let show_if = /*options*/ ctx[2].includes(CREATE);
    	let if_block_anchor;
    	let current;
    	let each_value = /*table*/ ctx[1];
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
    			attr(table_1, "class", "svelte-a9ek5x");
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
    			if (dirty[0] & /*name, handleCancelDelete, iconCancel, handleDeleteConfirmation, iconSend, options, handleCancelEdit, handleEditConfirmation, handleDetails, iconDetail, handleEdit, iconEdit, handleDelete, iconTrash, table, genericCrudTable*/ 196351) {
    				each_value = /*table*/ ctx[1];
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

    // (113:20) {#if i === 0}
    function create_if_block_8(ctx) {
    	let tr;
    	let t;
    	let td;
    	let each_value_2 = Object.keys(/*tableRow*/ ctx[31]);
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
    			td.innerHTML = `<textarea value="" disabled="" class="svelte-a9ek5x"></textarea>`;
    			attr(td, "id", "labelOptions");
    			attr(td, "class", "headline svelte-a9ek5x");
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
    			if (dirty[0] & /*genericCrudTable, table*/ 514) {
    				each_value_2 = Object.keys(/*tableRow*/ ctx[31]);
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

    // (115:28) {#each Object.keys(tableRow) as elem}
    function create_each_block_2(ctx) {
    	let td;
    	let textarea;
    	let textarea_value_value;
    	let td_class_value;
    	let td_width_value;

    	return {
    		c() {
    			td = element("td");
    			textarea = element("textarea");
    			textarea.value = textarea_value_value = /*genericCrudTable*/ ctx[9].makeCapitalLead(/*elem*/ ctx[34]);
    			textarea.disabled = true;
    			attr(textarea, "class", "svelte-a9ek5x");

    			attr(td, "class", td_class_value = "headline " + (/*genericCrudTable*/ ctx[9].showField(/*elem*/ ctx[34]) === false
    			? "hidden"
    			: "shown") + " svelte-a9ek5x");

    			attr(td, "width", td_width_value = /*genericCrudTable*/ ctx[9].showFieldWidth(/*elem*/ ctx[34]));
    		},
    		m(target, anchor) {
    			insert(target, td, anchor);
    			append(td, textarea);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*table*/ 2 && textarea_value_value !== (textarea_value_value = /*genericCrudTable*/ ctx[9].makeCapitalLead(/*elem*/ ctx[34]))) {
    				textarea.value = textarea_value_value;
    			}

    			if (dirty[0] & /*table*/ 2 && td_class_value !== (td_class_value = "headline " + (/*genericCrudTable*/ ctx[9].showField(/*elem*/ ctx[34]) === false
    			? "hidden"
    			: "shown") + " svelte-a9ek5x")) {
    				attr(td, "class", td_class_value);
    			}

    			if (dirty[0] & /*table*/ 2 && td_width_value !== (td_width_value = /*genericCrudTable*/ ctx[9].showFieldWidth(/*elem*/ ctx[34]))) {
    				attr(td, "width", td_width_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(td);
    		}
    	};
    }

    // (127:24) {#each Object.entries(tableRow) as elem}
    function create_each_block_1(ctx) {
    	let td;
    	let textarea;
    	let textarea_id_value;
    	let textarea_value_value;
    	let t0;
    	let div;
    	let t1_value = /*genericCrudTable*/ ctx[9].getValue(/*elem*/ ctx[34]) + "";
    	let t1;
    	let div_id_value;
    	let td_class_value;
    	let td_width_value;

    	return {
    		c() {
    			td = element("td");
    			textarea = element("textarea");
    			t0 = space();
    			div = element("div");
    			t1 = text(t1_value);
    			attr(textarea, "id", textarea_id_value = "" + (/*name*/ ctx[0] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[34]) + /*i*/ ctx[33]));
    			textarea.value = textarea_value_value = /*genericCrudTable*/ ctx[9].getValue(/*elem*/ ctx[34]);
    			textarea.disabled = true;
    			attr(textarea, "class", "svelte-a9ek5x");
    			attr(div, "class", "hidden svelte-a9ek5x");
    			attr(div, "id", div_id_value = "" + (/*name*/ ctx[0] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[34]) + /*i*/ ctx[33] + "copy"));

    			attr(td, "class", td_class_value = "" + (null_to_empty(/*genericCrudTable*/ ctx[9].showField(/*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[34])) === false
    			? "hidden"
    			: "shown") + " svelte-a9ek5x"));

    			attr(td, "width", td_width_value = /*genericCrudTable*/ ctx[9].showFieldWidth(/*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[34])));
    		},
    		m(target, anchor) {
    			insert(target, td, anchor);
    			append(td, textarea);
    			append(td, t0);
    			append(td, div);
    			append(div, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*name, table*/ 3 && textarea_id_value !== (textarea_id_value = "" + (/*name*/ ctx[0] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[34]) + /*i*/ ctx[33]))) {
    				attr(textarea, "id", textarea_id_value);
    			}

    			if (dirty[0] & /*table*/ 2 && textarea_value_value !== (textarea_value_value = /*genericCrudTable*/ ctx[9].getValue(/*elem*/ ctx[34]))) {
    				textarea.value = textarea_value_value;
    			}

    			if (dirty[0] & /*table*/ 2 && t1_value !== (t1_value = /*genericCrudTable*/ ctx[9].getValue(/*elem*/ ctx[34]) + "")) set_data(t1, t1_value);

    			if (dirty[0] & /*name, table*/ 3 && div_id_value !== (div_id_value = "" + (/*name*/ ctx[0] + /*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[34]) + /*i*/ ctx[33] + "copy"))) {
    				attr(div, "id", div_id_value);
    			}

    			if (dirty[0] & /*table*/ 2 && td_class_value !== (td_class_value = "" + (null_to_empty(/*genericCrudTable*/ ctx[9].showField(/*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[34])) === false
    			? "hidden"
    			: "shown") + " svelte-a9ek5x"))) {
    				attr(td, "class", td_class_value);
    			}

    			if (dirty[0] & /*table*/ 2 && td_width_value !== (td_width_value = /*genericCrudTable*/ ctx[9].showFieldWidth(/*genericCrudTable*/ ctx[9].getKey(/*elem*/ ctx[34])))) {
    				attr(td, "width", td_width_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(td);
    		}
    	};
    }

    // (136:32) {#if options.includes(DELETE)}
    function create_if_block_7(ctx) {
    	let div;
    	let current;
    	let dispose;
    	const icon = new Icon({ props: { icon: /*iconTrash*/ ctx[3] } });

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[24](/*i*/ ctx[33], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			create_component(icon.$$.fragment);
    			attr(div, "class", "options red svelte-a9ek5x");
    			attr(div, "title", "Delete");
    		},
    		m(target, anchor, remount) {
    			insert(target, div, anchor);
    			mount_component(icon, div, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen(div, "click", click_handler);
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

    // (141:32) {#if options.includes(EDIT)}
    function create_if_block_6(ctx) {
    	let div;
    	let current;
    	let dispose;
    	const icon = new Icon({ props: { icon: /*iconEdit*/ ctx[4] } });

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[25](/*i*/ ctx[33], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			create_component(icon.$$.fragment);
    			attr(div, "class", "options green svelte-a9ek5x");
    			attr(div, "title", "Edit");
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

    // (146:32) {#if options.includes(DETAILS)}
    function create_if_block_5(ctx) {
    	let div;
    	let current;
    	let dispose;
    	const icon = new Icon({ props: { icon: /*iconDetail*/ ctx[7] } });

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[26](/*i*/ ctx[33], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			create_component(icon.$$.fragment);
    			attr(div, "class", "options blue svelte-a9ek5x");
    			attr(div, "title", "Details");
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

    // (153:32) {#if options.includes(EDIT)}
    function create_if_block_4(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let current;
    	let dispose;
    	const icon0 = new Icon({ props: { icon: /*iconSend*/ ctx[5] } });

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[27](/*i*/ ctx[33], ...args);
    	}

    	const icon1 = new Icon({ props: { icon: /*iconCancel*/ ctx[6] } });

    	function click_handler_4(...args) {
    		return /*click_handler_4*/ ctx[28](/*i*/ ctx[33], ...args);
    	}

    	return {
    		c() {
    			div0 = element("div");
    			create_component(icon0.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(icon1.$$.fragment);
    			attr(div0, "class", "options green svelte-a9ek5x");
    			attr(div0, "title", "Update");
    			attr(div1, "class", "options red svelte-a9ek5x");
    			attr(div1, "title", "Cancel");
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
    				listen(div0, "click", click_handler_3),
    				listen(div1, "click", click_handler_4)
    			];
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
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

    // (163:32) {#if options.includes(DELETE)}
    function create_if_block_3(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let current;
    	let dispose;
    	const icon0 = new Icon({ props: { icon: /*iconSend*/ ctx[5] } });

    	function click_handler_5(...args) {
    		return /*click_handler_5*/ ctx[29](/*i*/ ctx[33], ...args);
    	}

    	const icon1 = new Icon({ props: { icon: /*iconCancel*/ ctx[6] } });

    	function click_handler_6(...args) {
    		return /*click_handler_6*/ ctx[30](/*i*/ ctx[33], ...args);
    	}

    	return {
    		c() {
    			div0 = element("div");
    			create_component(icon0.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(icon1.$$.fragment);
    			attr(div0, "class", "options green svelte-a9ek5x");
    			attr(div0, "title", "Delete");
    			attr(div1, "class", "options red svelte-a9ek5x");
    			attr(div1, "title", "Cancel");
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
    				listen(div0, "click", click_handler_5),
    				listen(div1, "click", click_handler_6)
    			];
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
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

    // (112:16) {#each table as tableRow, i}
    function create_each_block(ctx) {
    	let t0;
    	let tr;
    	let t1;
    	let td;
    	let div0;
    	let show_if_4 = /*options*/ ctx[2].includes(DELETE);
    	let t2;
    	let show_if_3 = /*options*/ ctx[2].includes(EDIT);
    	let t3;
    	let show_if_2 = /*options*/ ctx[2].includes(DETAILS);
    	let div0_id_value;
    	let t4;
    	let div1;
    	let show_if_1 = /*options*/ ctx[2].includes(EDIT);
    	let div1_id_value;
    	let t5;
    	let div2;
    	let show_if = /*options*/ ctx[2].includes(DELETE);
    	let div2_id_value;
    	let t6;
    	let current;
    	let if_block0 = /*i*/ ctx[33] === 0 && create_if_block_8(ctx);
    	let each_value_1 = Object.entries(/*tableRow*/ ctx[31]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block1 = show_if_4 && create_if_block_7(ctx);
    	let if_block2 = show_if_3 && create_if_block_6(ctx);
    	let if_block3 = show_if_2 && create_if_block_5(ctx);
    	let if_block4 = show_if_1 && create_if_block_4(ctx);
    	let if_block5 = show_if && create_if_block_3(ctx);

    	return {
    		c() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			td = element("td");
    			div0 = element("div");
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			t3 = space();
    			if (if_block3) if_block3.c();
    			t4 = space();
    			div1 = element("div");
    			if (if_block4) if_block4.c();
    			t5 = space();
    			div2 = element("div");
    			if (if_block5) if_block5.c();
    			t6 = space();
    			attr(div0, "id", div0_id_value = "" + (/*name*/ ctx[0] + "options-default" + /*i*/ ctx[33]));
    			attr(div0, "class", "options shown svelte-a9ek5x");
    			attr(div1, "id", div1_id_value = "" + (/*name*/ ctx[0] + "options-edit" + /*i*/ ctx[33]));
    			attr(div1, "class", "options hidden svelte-a9ek5x");
    			attr(div2, "id", div2_id_value = "" + (/*name*/ ctx[0] + "options-delete" + /*i*/ ctx[33]));
    			attr(div2, "class", "options hidden svelte-a9ek5x");
    			attr(td, "class", "svelte-a9ek5x");
    			attr(tr, "class", "row svelte-a9ek5x");
    		},
    		m(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t0, anchor);
    			insert(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append(tr, t1);
    			append(tr, td);
    			append(td, div0);
    			if (if_block1) if_block1.m(div0, null);
    			append(div0, t2);
    			if (if_block2) if_block2.m(div0, null);
    			append(div0, t3);
    			if (if_block3) if_block3.m(div0, null);
    			append(td, t4);
    			append(td, div1);
    			if (if_block4) if_block4.m(div1, null);
    			append(td, t5);
    			append(td, div2);
    			if (if_block5) if_block5.m(div2, null);
    			append(tr, t6);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*i*/ ctx[33] === 0) if_block0.p(ctx, dirty);

    			if (dirty[0] & /*genericCrudTable, table, name*/ 515) {
    				each_value_1 = Object.entries(/*tableRow*/ ctx[31]);
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

    			if (dirty[0] & /*options*/ 4) show_if_4 = /*options*/ ctx[2].includes(DELETE);

    			if (show_if_4) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*options*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_7(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*options*/ 4) show_if_3 = /*options*/ ctx[2].includes(EDIT);

    			if (show_if_3) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*options*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_6(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div0, t3);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*options*/ 4) show_if_2 = /*options*/ ctx[2].includes(DETAILS);

    			if (show_if_2) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*options*/ 4) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_5(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div0, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*name*/ 1 && div0_id_value !== (div0_id_value = "" + (/*name*/ ctx[0] + "options-default" + /*i*/ ctx[33]))) {
    				attr(div0, "id", div0_id_value);
    			}

    			if (dirty[0] & /*options*/ 4) show_if_1 = /*options*/ ctx[2].includes(EDIT);

    			if (show_if_1) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*options*/ 4) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_4(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div1, null);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*name*/ 1 && div1_id_value !== (div1_id_value = "" + (/*name*/ ctx[0] + "options-edit" + /*i*/ ctx[33]))) {
    				attr(div1, "id", div1_id_value);
    			}

    			if (dirty[0] & /*options*/ 4) show_if = /*options*/ ctx[2].includes(DELETE);

    			if (show_if) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty[0] & /*options*/ 4) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_3(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(div2, null);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*name*/ 1 && div2_id_value !== (div2_id_value = "" + (/*name*/ ctx[0] + "options-delete" + /*i*/ ctx[33]))) {
    				attr(div2, "id", div2_id_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(tr);
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    		}
    	};
    }

    // (176:12) {#if options.includes(CREATE)}
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
    			attr(div, "class", "options svelte-a9ek5x");
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
    	let if_block = /*table*/ ctx[1] !== undefined && create_if_block(ctx);

    	return {
    		c() {
    			main = element("main");
    			if (if_block) if_block.c();
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*table*/ ctx[1] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*table*/ 2) {
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

    	const click_handler = i => handleDelete(i);
    	const click_handler_1 = i => handleEdit(i);
    	const click_handler_2 = i => handleDetails(i);
    	const click_handler_3 = i => handleEditConfirmation(i);
    	const click_handler_4 = i => handleCancelEdit(i);
    	const click_handler_5 = i => handleDeleteConfirmation(i);
    	const click_handler_6 = i => handleCancelDelete(i);

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("show_fields" in $$props) $$invalidate(18, show_fields = $$props.show_fields);
    		if ("editable_fields" in $$props) $$invalidate(19, editable_fields = $$props.editable_fields);
    		if ("table" in $$props) $$invalidate(1, table = $$props.table);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	return [
    		name,
    		table,
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
    		show_fields,
    		editable_fields,
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
    		click_handler_6
    	];
    }

    class SvelteGenericCrudTable extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document_1.getElementById("svelte-a9ek5x-style")) add_css$1();

    		init(
    			this,
    			options,
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{
    				name: 0,
    				show_fields: 18,
    				editable_fields: 19,
    				table: 1,
    				options: 2
    			},
    			[-1, -1]
    		);
    	}
    }

    return SvelteGenericCrudTable;

})));


(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
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
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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
    function createEventDispatcher() {
        const component = current_component;
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
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
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
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
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
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
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
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
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

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Header.svelte generated by Svelte v3.12.1 */

    const file = "src/Header.svelte";

    function create_fragment(ctx) {
    	var h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Sortid";
    			attr_dev(h1, "class", "svelte-555ctl");
    			add_location(h1, file, 8, 0, 97);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Header", options, id: create_fragment.name });
    	}
    }

    /* src/Searchbar.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/Searchbar.svelte";

    function create_fragment$1(ctx) {
    	var div, input, t, button, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t = space();
    			button = element("button");
    			button.textContent = "Submit";
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter subreddit name here...");
    			attr_dev(input, "class", "svelte-x4uexa");
    			add_location(input, file$1, 80, 2, 1679);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-x4uexa");
    			add_location(button, file$1, 85, 2, 1805);
    			attr_dev(div, "class", "searcharea svelte-x4uexa");
    			add_location(div, file$1, 79, 0, 1652);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler),
    				listen_dev(input, "keyup", ctx.checkKey),
    				listen_dev(button, "click", ctx.process)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);

    			set_input_value(input, ctx.inputText);

    			append_dev(div, t);
    			append_dev(div, button);
    		},

    		p: function update(changed, ctx) {
    			if (changed.inputText && (input.value !== ctx.inputText)) set_input_value(input, ctx.inputText);
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatcher = createEventDispatcher();

      let inputText;

      const checkKey = e => {
        if (e.keyCode === 13) {
          e.preventDefault();
          process();
        }
      };

      const fetchRedditData = async subredditName => {
        if (subredditName) {
          const uri = `https://www.reddit.com/r/${subredditName}.json`;

          const response = await fetch(uri);
          const data = await response.json();
          return data;
        }
      };

      const getImportantDatapoints = entry => {
        return {
          title: entry.data.title,
          author: entry.data.author,
          preview: entry.data.thumbnail,
          upvotes: entry.data.ups,
          comments: entry.data.num_comments,
          url: entry.data.url
        };
      };

      const getNFormattedEntries = (totalEntries, numOfEntries) => {
        const relevant = [];

        let index = 0;
        let validEntries = 0;

        while (validEntries < numOfEntries) {
          const currentEntry = totalEntries.data.children[index];
          if (currentEntry.data.thumbnail != "self") {
            index++;
            validEntries++;
            relevant.push(getImportantDatapoints(currentEntry));
          } else {
            index++;
          }
        }
        return relevant;
      };

      const process = async () => {
        const fetchedData = await fetchRedditData(inputText);
        $$invalidate('inputText', inputText = "");
        const entriesToDisplay = getNFormattedEntries(fetchedData, 6);
        dispatcher("displaydata", entriesToDisplay);
      };

    	function input_input_handler() {
    		inputText = this.value;
    		$$invalidate('inputText', inputText);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('inputText' in $$props) $$invalidate('inputText', inputText = $$props.inputText);
    	};

    	return {
    		inputText,
    		checkKey,
    		process,
    		input_input_handler
    	};
    }

    class Searchbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Searchbar", options, id: create_fragment$1.name });
    	}
    }

    /* src/Card.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/Card.svelte";

    function create_fragment$2(ctx) {
    	var div, img, t0, hr, t1, h4, t2, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			h4 = element("h4");
    			t2 = text(ctx.title);
    			attr_dev(img, "src", ctx.preview);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-1gh2pcm");
    			add_location(img, file$2, 51, 2, 781);
    			attr_dev(hr, "class", "svelte-1gh2pcm");
    			add_location(hr, file$2, 52, 2, 832);
    			attr_dev(h4, "class", "svelte-1gh2pcm");
    			add_location(h4, file$2, 53, 2, 841);
    			attr_dev(div, "class", "card svelte-1gh2pcm");
    			add_location(div, file$2, 50, 0, 760);
    			dispose = listen_dev(img, "click", ctx.openLink);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, hr);
    			append_dev(div, t1);
    			append_dev(div, h4);
    			append_dev(h4, t2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.preview) {
    				attr_dev(img, "src", ctx.preview);
    			}

    			if (changed.title) {
    				set_data_dev(t2, ctx.title);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { title, author, preview, url, upvotes, comments } = $$props;

      const openLink = () => {
        window.open(url, "_blank");
      };

    	const writable_props = ['title', 'author', 'preview', 'url', 'upvotes', 'comments'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('author' in $$props) $$invalidate('author', author = $$props.author);
    		if ('preview' in $$props) $$invalidate('preview', preview = $$props.preview);
    		if ('url' in $$props) $$invalidate('url', url = $$props.url);
    		if ('upvotes' in $$props) $$invalidate('upvotes', upvotes = $$props.upvotes);
    		if ('comments' in $$props) $$invalidate('comments', comments = $$props.comments);
    	};

    	$$self.$capture_state = () => {
    		return { title, author, preview, url, upvotes, comments };
    	};

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('author' in $$props) $$invalidate('author', author = $$props.author);
    		if ('preview' in $$props) $$invalidate('preview', preview = $$props.preview);
    		if ('url' in $$props) $$invalidate('url', url = $$props.url);
    		if ('upvotes' in $$props) $$invalidate('upvotes', upvotes = $$props.upvotes);
    		if ('comments' in $$props) $$invalidate('comments', comments = $$props.comments);
    	};

    	return {
    		title,
    		author,
    		preview,
    		url,
    		upvotes,
    		comments,
    		openLink
    	};
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, ["title", "author", "preview", "url", "upvotes", "comments"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Card", options, id: create_fragment$2.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.title === undefined && !('title' in props)) {
    			console.warn("<Card> was created without expected prop 'title'");
    		}
    		if (ctx.author === undefined && !('author' in props)) {
    			console.warn("<Card> was created without expected prop 'author'");
    		}
    		if (ctx.preview === undefined && !('preview' in props)) {
    			console.warn("<Card> was created without expected prop 'preview'");
    		}
    		if (ctx.url === undefined && !('url' in props)) {
    			console.warn("<Card> was created without expected prop 'url'");
    		}
    		if (ctx.upvotes === undefined && !('upvotes' in props)) {
    			console.warn("<Card> was created without expected prop 'upvotes'");
    		}
    		if (ctx.comments === undefined && !('comments' in props)) {
    			console.warn("<Card> was created without expected prop 'comments'");
    		}
    	}

    	get title() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get author() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set author(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get preview() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set preview(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get upvotes() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set upvotes(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get comments() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set comments(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    const file$3 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.post = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.post = list[i];
    	return child_ctx;
    }

    // (34:2) {#if topRow.length > 0}
    function create_if_block_1(ctx) {
    	var each_1_anchor, current;

    	let each_value_1 = ctx.topRow;

    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.topRow) {
    				each_value_1 = ctx.topRow;

    				let i;
    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach_dev(each_1_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(34:2) {#if topRow.length > 0}", ctx });
    	return block;
    }

    // (35:4) {#each topRow as post}
    function create_each_block_1(ctx) {
    	var current;

    	var card = new Card({
    		props: {
    		preview: ctx.post.preview,
    		title: ctx.post.title,
    		author: ctx.post.author,
    		url: ctx.post.url,
    		upvotes: ctx.post.upvotes,
    		comments: ctx.post.comments
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			card.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var card_changes = {};
    			if (changed.topRow) card_changes.preview = ctx.post.preview;
    			if (changed.topRow) card_changes.title = ctx.post.title;
    			if (changed.topRow) card_changes.author = ctx.post.author;
    			if (changed.topRow) card_changes.url = ctx.post.url;
    			if (changed.topRow) card_changes.upvotes = ctx.post.upvotes;
    			if (changed.topRow) card_changes.comments = ctx.post.comments;
    			card.$set(card_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_1.name, type: "each", source: "(35:4) {#each topRow as post}", ctx });
    	return block;
    }

    // (47:2) {#if bottomRow.length > 0}
    function create_if_block(ctx) {
    	var each_1_anchor, current;

    	let each_value = ctx.bottomRow;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.bottomRow) {
    				each_value = ctx.bottomRow;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach_dev(each_1_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(47:2) {#if bottomRow.length > 0}", ctx });
    	return block;
    }

    // (48:4) {#each bottomRow as post}
    function create_each_block(ctx) {
    	var current;

    	var card = new Card({
    		props: {
    		preview: ctx.post.preview,
    		title: ctx.post.title,
    		author: ctx.post.author,
    		url: ctx.post.url,
    		upvotes: ctx.post.upvotes,
    		comments: ctx.post.comments
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			card.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var card_changes = {};
    			if (changed.bottomRow) card_changes.preview = ctx.post.preview;
    			if (changed.bottomRow) card_changes.title = ctx.post.title;
    			if (changed.bottomRow) card_changes.author = ctx.post.author;
    			if (changed.bottomRow) card_changes.url = ctx.post.url;
    			if (changed.bottomRow) card_changes.upvotes = ctx.post.upvotes;
    			if (changed.bottomRow) card_changes.comments = ctx.post.comments;
    			card.$set(card_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(48:4) {#each bottomRow as post}", ctx });
    	return block;
    }

    function create_fragment$3(ctx) {
    	var t0, t1, div0, t2, div1, current;

    	var header = new Header({ $$inline: true });

    	var searchbar = new Searchbar({ $$inline: true });
    	searchbar.$on("displaydata", ctx.dataSplitter);

    	var if_block0 = (ctx.topRow.length > 0) && create_if_block_1(ctx);

    	var if_block1 = (ctx.bottomRow.length > 0) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			header.$$.fragment.c();
    			t0 = space();
    			searchbar.$$.fragment.c();
    			t1 = space();
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t2 = space();
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "id", "topRow");
    			attr_dev(div0, "class", "cardRow svelte-rr3od4");
    			add_location(div0, file$3, 32, 0, 582);
    			attr_dev(div1, "id", "bottomRow");
    			attr_dev(div1, "class", "cardRow svelte-rr3od4");
    			add_location(div1, file$3, 45, 0, 885);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(searchbar, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			if (if_block0) if_block0.m(div0, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.topRow.length > 0) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (ctx.bottomRow.length > 0) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			transition_in(searchbar.$$.fragment, local);

    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(header, detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			destroy_component(searchbar, detaching);

    			if (detaching) {
    				detach_dev(t1);
    				detach_dev(div0);
    			}

    			if (if_block0) if_block0.d();

    			if (detaching) {
    				detach_dev(t2);
    				detach_dev(div1);
    			}

    			if (if_block1) if_block1.d();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

      let topRow = [];
      let bottomRow = [];

      const dataSplitter = e => {
        const data = e.detail;

        if (data.length % 2 == 0) {
          const halfPoint = data.length / 2;
          $$invalidate('topRow', topRow = data.splice(0, halfPoint));
          $$invalidate('bottomRow', bottomRow = data);
        }
      };

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('topRow' in $$props) $$invalidate('topRow', topRow = $$props.topRow);
    		if ('bottomRow' in $$props) $$invalidate('bottomRow', bottomRow = $$props.bottomRow);
    	};

    	return { topRow, bottomRow, dataSplitter };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$3.name });
    	}
    }

    const app = new App({
      target: document.body,
      props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

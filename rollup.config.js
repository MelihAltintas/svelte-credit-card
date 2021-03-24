(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Knob = factory());
}(this, (function () { 'use strict';

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

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
            set_current_component(null);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    /* src\CreditCard.svelte generated by Svelte v3.35.0 */

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-164z982-style";
    	style.textContent = ".card.svelte-164z982.svelte-164z982{width:400px;height:280px}.flip.svelte-164z982.svelte-164z982{width:inherit;height:inherit;transition:0.7s;transform-style:preserve-3d}.front.svelte-164z982.svelte-164z982,.back.svelte-164z982.svelte-164z982{position:absolute;width:inherit;height:inherit;border-radius:15px;color:#fff;text-shadow:0 1px 1px rgba(0, 0, 0, 0.3);box-shadow:0 1px 10px 1px rgba(0, 0, 0, 0.3);-webkit-backface-visibility:hidden;backface-visibility:hidden;background-image:linear-gradient(to right, #111, #555);overflow:hidden}.front.svelte-164z982.svelte-164z982{transform:translateZ(0)}.strip-bottom.svelte-164z982.svelte-164z982,.strip-top.svelte-164z982.svelte-164z982{position:absolute;right:0;height:inherit;background-image:linear-gradient(to bottom, #ff6767, #ff4545);box-shadow:0 0 10px 0px rgba(0, 0, 0, 0.5)}.strip-bottom.svelte-164z982.svelte-164z982{width:200px;transform:skewX(-15deg) translateX(50px)}.strip-top.svelte-164z982.svelte-164z982{width:180px;transform:skewX(20deg) translateX(50px)}.logo.svelte-164z982.svelte-164z982{position:absolute;top:30px;right:25px}.investor.svelte-164z982.svelte-164z982{position:relative;top:30px;left:25px;text-transform:uppercase}.chip.svelte-164z982.svelte-164z982{position:relative;top:60px;left:25px;display:flex;align-items:center;justify-content:center;width:50px;height:40px;border-radius:5px;background-image:linear-gradient(to bottom left, #ffecc7, #d0b978);overflow:hidden}.chip.svelte-164z982 .chip-line.svelte-164z982{position:absolute;width:100%;height:1px;background-color:#333}.chip.svelte-164z982 .chip-line.svelte-164z982:nth-child(1){top:13px}.chip.svelte-164z982 .chip-line.svelte-164z982:nth-child(2){top:20px}.chip.svelte-164z982 .chip-line.svelte-164z982:nth-child(3){top:28px}.chip.svelte-164z982 .chip-line.svelte-164z982:nth-child(4){left:25px;width:1px;height:50px}.chip.svelte-164z982 .chip-main.svelte-164z982{width:20px;height:25px;border:1px solid #333;border-radius:3px;background-image:linear-gradient(to bottom left, #efdbab, #e1cb94);z-index:1}.wave.svelte-164z982.svelte-164z982{position:relative;top:20px;left:100px}.card-number.svelte-164z982.svelte-164z982{position:relative;display:flex;justify-content:space-between;align-items:center;margin:40px 25px 10px;font-size:23px;font-family:'cc font', monospace;padding:3px}.end.svelte-164z982.svelte-164z982{margin-left:25px;text-transform:uppercase;font-family:'cc font', monospace;padding:3px;display:inline-block}.end.svelte-164z982 .end-text.svelte-164z982{font-size:9px;color:rgba(255, 255, 255, 0.8)}.card-holder.svelte-164z982.svelte-164z982{margin:10px 25px;text-transform:uppercase;font-family:'cc font', monospace;padding:3px;display:inline-block}.card.svelte-164z982.svelte-164z982{perspective:1000}.back.svelte-164z982.svelte-164z982{transform:rotateY(180deg) translateZ(0);background:#9e9e9e}.back.svelte-164z982 .strip-black.svelte-164z982{position:absolute;top:30px;left:0;width:100%;height:50px;background:#000}.back.svelte-164z982 .ccv.svelte-164z982{position:absolute;top:110px;left:0;right:0;height:36px;width:90%;padding:10px;margin:0 auto;border-radius:5px;text-align:right;letter-spacing:1px;color:#000;background:#fff;padding:3px}.back.svelte-164z982 .ccv label.svelte-164z982{display:block;margin:-30px 0 15px;font-size:10px;text-transform:uppercase;color:#fff}@-webkit-keyframes svelte-164z982-flip{0%,100%{transform:rotateY(0deg)}50%{transform:rotateY(180deg)}}@keyframes svelte-164z982-flip{0%,100%{transform:rotateY(0deg)}50%{transform:rotateY(180deg)}}";
    	append(document.head, style);
    }

    function create_fragment(ctx) {
    	let div23;
    	let div22;
    	let div21;
    	let div16;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let div2;
    	let t3;
    	let t4;
    	let div8;
    	let t9;
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let t10;
    	let div13;
    	let div9;
    	let t11_value = /*cardNumberData*/ ctx[10].substr(0, 4) + "";
    	let t11;
    	let t12;
    	let div10;
    	let t13_value = /*cardNumberData*/ ctx[10].substr(4, 4) + "";
    	let t13;
    	let t14;
    	let div11;
    	let t15_value = /*cardNumberData*/ ctx[10].substr(8, 4) + "";
    	let t15;
    	let t16;
    	let div12;
    	let t17_value = /*cardNumberData*/ ctx[10].substr(12, 4) + "";
    	let t17;
    	let t18;
    	let div14;
    	let span0;
    	let span1;
    	let t20;
    	let t21;
    	let br;
    	let t22;
    	let div15;
    	let t23;
    	let t24;
    	let div20;
    	let div17;
    	let t25;
    	let div19;
    	let label;
    	let t27;
    	let div18;
    	let t28;

    	return {
    		c() {
    			div23 = element("div");
    			div22 = element("div");
    			div21 = element("div");
    			div16 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			div2 = element("div");
    			t3 = text(/*investor*/ ctx[0]);
    			t4 = space();
    			div8 = element("div");

    			div8.innerHTML = `<div class="chip-line svelte-164z982"></div> 
                    <div class="chip-line svelte-164z982"></div> 
                    <div class="chip-line svelte-164z982"></div> 
                    <div class="chip-line svelte-164z982"></div> 
                    <div class="chip-main svelte-164z982"></div>`;

    			t9 = space();
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t10 = space();
    			div13 = element("div");
    			div9 = element("div");
    			t11 = text(t11_value);
    			t12 = space();
    			div10 = element("div");
    			t13 = text(t13_value);
    			t14 = space();
    			div11 = element("div");
    			t15 = text(t15_value);
    			t16 = space();
    			div12 = element("div");
    			t17 = text(t17_value);
    			t18 = space();
    			div14 = element("div");
    			span0 = element("span");
    			span0.textContent = "exp. end: ";
    			span1 = element("span");
    			t20 = text(/*expDate*/ ctx[1]);
    			t21 = space();
    			br = element("br");
    			t22 = space();
    			div15 = element("div");
    			t23 = text(/*cardHolder*/ ctx[2]);
    			t24 = space();
    			div20 = element("div");
    			div17 = element("div");
    			t25 = space();
    			div19 = element("div");
    			label = element("label");
    			label.textContent = "CCV";
    			t27 = space();
    			div18 = element("div");
    			t28 = text(/*ccv*/ ctx[3]);
    			attr(div0, "class", "strip-bottom svelte-164z982");
    			attr(div1, "class", "strip-top svelte-164z982");
    			attr(img, "class", "logo svelte-164z982");
    			if (img.src !== (img_src_value = /*getSrc*/ ctx[9]())) attr(img, "src", img_src_value);
    			attr(img, "alt", "logo");
    			attr(img, "width", "100");
    			attr(div2, "class", "investor svelte-164z982");
    			attr(div8, "class", "chip svelte-164z982");
    			attr(path0, "d", "M19.709 3.719c.266.043.5.187.656.406 4.125 5.207 6.594 11.781 6.594 18.938 0 7.156-2.469 13.73-6.594 18.937-.195.336-.57.531-.957.492a.9946.9946 0 0 1-.851-.66c-.129-.367-.035-.777.246-1.051 3.855-4.867 6.156-11.023 6.156-17.718 0-6.696-2.301-12.852-6.156-17.719-.262-.317-.301-.762-.102-1.121.204-.36.602-.559 1.008-.504z");
    			attr(path1, "d", "M13.74 7.563c.231.039.442.164.594.343 3.508 4.059 5.625 9.371 5.625 15.157 0 5.785-2.113 11.097-5.625 15.156-.363.422-1 .472-1.422.109-.422-.363-.472-1-.109-1.422 3.211-3.711 5.156-8.551 5.156-13.843 0-5.293-1.949-10.133-5.156-13.844-.27-.309-.324-.75-.141-1.114.188-.367.578-.582.985-.542h.093z");
    			attr(path2, "d", "M7.584 11.438c.227.031.438.144.594.312 2.953 2.863 4.781 6.875 4.781 11.313 0 4.433-1.828 8.449-4.781 11.312-.398.387-1.035.383-1.422-.016-.387-.398-.383-1.035.016-1.421 2.582-2.504 4.187-5.993 4.187-9.875 0-3.883-1.605-7.372-4.187-9.875-.321-.282-.426-.739-.266-1.133.164-.395.559-.641.984-.617h.094zM1.178 15.531c.121.02.238.063.344.125 2.633 1.414 4.437 4.215 4.437 7.407 0 3.195-1.797 5.996-4.437 7.406-.492.258-1.102.07-1.36-.422-.257-.492-.07-1.102.422-1.359 2.012-1.075 3.375-3.176 3.375-5.625 0-2.446-1.371-4.551-3.375-5.625-.441-.204-.676-.692-.551-1.165.122-.468.567-.785 1.051-.742h.094z");
    			attr(svg, "class", "wave svelte-164z982");
    			attr(svg, "viewBox", "0 3.71 26.959 38.787");
    			attr(svg, "width", "26.959");
    			attr(svg, "height", "38.787");
    			attr(svg, "fill", "white");
    			attr(div9, "class", "section");
    			attr(div10, "class", "section");
    			attr(div11, "class", "section");
    			attr(div12, "class", "section");
    			attr(div13, "class", "card-number svelte-164z982");
    			attr(div13, "id", "card-number");
    			attr(span0, "class", "end-text svelte-164z982");
    			attr(span1, "class", "end-date");
    			attr(div14, "class", "end svelte-164z982");
    			attr(div14, "id", "end");
    			attr(div15, "class", "card-holder svelte-164z982");
    			attr(div15, "id", "card-holder");
    			attr(div16, "class", "front svelte-164z982");
    			attr(div17, "class", "strip-black svelte-164z982");
    			attr(label, "class", "svelte-164z982");
    			attr(div19, "class", "ccv svelte-164z982");
    			attr(div19, "id", "ccv");
    			attr(div20, "class", "back svelte-164z982");
    			attr(div21, "class", "flip svelte-164z982");
    			attr(div22, "class", "card svelte-164z982");
    			attr(div23, "class", "center");
    		},
    		m(target, anchor) {
    			insert(target, div23, anchor);
    			append(div23, div22);
    			append(div22, div21);
    			append(div21, div16);
    			append(div16, div0);
    			append(div16, t0);
    			append(div16, div1);
    			append(div16, t1);
    			append(div16, img);
    			append(div16, t2);
    			append(div16, div2);
    			append(div2, t3);
    			append(div16, t4);
    			append(div16, div8);
    			append(div16, t9);
    			append(div16, svg);
    			append(svg, path0);
    			append(svg, path1);
    			append(svg, path2);
    			append(div16, t10);
    			append(div16, div13);
    			append(div13, div9);
    			append(div9, t11);
    			append(div13, t12);
    			append(div13, div10);
    			append(div10, t13);
    			append(div13, t14);
    			append(div13, div11);
    			append(div11, t15);
    			append(div13, t16);
    			append(div13, div12);
    			append(div12, t17);
    			/*div13_binding*/ ctx[17](div13);
    			append(div16, t18);
    			append(div16, div14);
    			append(div14, span0);
    			append(div14, span1);
    			append(span1, t20);
    			/*div14_binding*/ ctx[18](div14);
    			append(div16, t21);
    			append(div16, br);
    			append(div16, t22);
    			append(div16, div15);
    			append(div15, t23);
    			/*div15_binding*/ ctx[19](div15);
    			append(div21, t24);
    			append(div21, div20);
    			append(div20, div17);
    			append(div20, t25);
    			append(div20, div19);
    			append(div19, label);
    			append(div19, t27);
    			append(div19, div18);
    			append(div18, t28);
    			/*div19_binding*/ ctx[20](div19);
    			/*div21_binding*/ ctx[21](div21);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*getSrc*/ 512 && img.src !== (img_src_value = /*getSrc*/ ctx[9]())) {
    				attr(img, "src", img_src_value);
    			}

    			if (dirty & /*investor*/ 1) set_data(t3, /*investor*/ ctx[0]);
    			if (dirty & /*cardNumberData*/ 1024 && t11_value !== (t11_value = /*cardNumberData*/ ctx[10].substr(0, 4) + "")) set_data(t11, t11_value);
    			if (dirty & /*cardNumberData*/ 1024 && t13_value !== (t13_value = /*cardNumberData*/ ctx[10].substr(4, 4) + "")) set_data(t13, t13_value);
    			if (dirty & /*cardNumberData*/ 1024 && t15_value !== (t15_value = /*cardNumberData*/ ctx[10].substr(8, 4) + "")) set_data(t15, t15_value);
    			if (dirty & /*cardNumberData*/ 1024 && t17_value !== (t17_value = /*cardNumberData*/ ctx[10].substr(12, 4) + "")) set_data(t17, t17_value);
    			if (dirty & /*expDate*/ 2) set_data(t20, /*expDate*/ ctx[1]);
    			if (dirty & /*cardHolder*/ 4) set_data(t23, /*cardHolder*/ ctx[2]);
    			if (dirty & /*ccv*/ 8) set_data(t28, /*ccv*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div23);
    			/*div13_binding*/ ctx[17](null);
    			/*div14_binding*/ ctx[18](null);
    			/*div15_binding*/ ctx[19](null);
    			/*div19_binding*/ ctx[20](null);
    			/*div21_binding*/ ctx[21](null);
    		}
    	};
    }

    function cardType(number) {
    	let re = new RegExp("^4");
    	if (number.match(re) != null) return "visa";
    	re = new RegExp("^(34|37)");
    	if (number.match(re) != null) return "amex";
    	re = new RegExp("^5[1-5]");
    	if (number.match(re) != null) return "mastercard";
    	re = new RegExp("^6011");
    	if (number.match(re) != null) return "discover";
    	re = new RegExp("^62");
    	if (number.match(re) != null) return "unionpay";
    	re = new RegExp("^9792");
    	if (number.match(re) != null) return "troy";
    	re = new RegExp("^3(?:0([0-5]|9)|[689]\\d?)\\d{0,11}");
    	if (number.match(re) != null) return "dinersclub";
    	re = new RegExp("^35(2[89]|[3-8])");
    	if (number.match(re) != null) return "jcb";
    	return "visa"; // default type
    }

    function instance($$self, $$props, $$invalidate) {
    	let getSrc;
    	let cardNumberData;
    	let { investor = "INVESTOR" } = $$props;
    	let { cardNumber = "0000000000000000" } = $$props;
    	let { expDate = "03/21" } = $$props;
    	let { cardHolder = "Melih Altıntaş" } = $$props;
    	let { ccv = "000" } = $$props;
    	let flip;
    	let currentFocusElement;
    	let cardNumberElement;
    	let expDateElement;
    	let cardHolderElement;
    	let ccvElement;

    	function focusCardNumber() {
    		removeAllFocus();
    		focusElement(cardNumberElement);
    	}

    	function focusExpDateElement() {
    		removeAllFocus();
    		focusElement(expDateElement);
    	}

    	function focusCardHolderElement() {
    		removeAllFocus();
    		focusElement(cardHolderElement);
    	}

    	function focusCcvElement() {
    		removeAllFocus();
    		focusElement(ccvElement);
    	}

    	function flipCard(index) {
    		console.log("flip card");

    		if (index == 1) {
    			$$invalidate(4, flip.style = "transform: rotateY(180deg);", flip);
    		} else if (index == 0) {
    			$$invalidate(4, flip.style = "", flip);
    		}
    	}

    	function focusElement(element) {
    		console.log(element.id, currentFocusElement);

    		if (currentFocusElement == undefined && element.id == "ccv") {
    			flipCard(1);
    		} else if (currentFocusElement != undefined && currentFocusElement.id != "ccv" && element.id == "ccv") {
    			flipCard(1);
    		} else if (currentFocusElement != undefined && currentFocusElement.id == "ccv" && element.id != "ccv") {
    			flipCard(0);
    		}

    		element.style = "border:1px solid white;transition: border-width 0.6s linear;padding:3px";
    		currentFocusElement = element;
    	}

    	function removeAllFocus() {
    		$$invalidate(5, cardNumberElement.style = "", cardNumberElement);
    		$$invalidate(6, expDateElement.style = "", expDateElement);
    		$$invalidate(7, cardHolderElement.style = "", cardHolderElement);
    		$$invalidate(8, ccvElement.style = "", ccvElement);
    	}

    	onMount(async () => {
    		changeFocus();
    	});

    	function div13_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			cardNumberElement = $$value;
    			$$invalidate(5, cardNumberElement);
    		});
    	}

    	function div14_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			expDateElement = $$value;
    			$$invalidate(6, expDateElement);
    		});
    	}

    	function div15_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			cardHolderElement = $$value;
    			$$invalidate(7, cardHolderElement);
    		});
    	}

    	function div19_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			ccvElement = $$value;
    			$$invalidate(8, ccvElement);
    		});
    	}

    	function div21_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			flip = $$value;
    			$$invalidate(4, flip);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("investor" in $$props) $$invalidate(0, investor = $$props.investor);
    		if ("cardNumber" in $$props) $$invalidate(11, cardNumber = $$props.cardNumber);
    		if ("expDate" in $$props) $$invalidate(1, expDate = $$props.expDate);
    		if ("cardHolder" in $$props) $$invalidate(2, cardHolder = $$props.cardHolder);
    		if ("ccv" in $$props) $$invalidate(3, ccv = $$props.ccv);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*cardNumber*/ 2048) {
    			$$invalidate(9, getSrc = () => {
    				return "creditcards/" + cardType(cardNumber) + ".png";
    			});
    		}

    		if ($$self.$$.dirty & /*cardNumber*/ 2048) {
    			$$invalidate(10, cardNumberData = cardNumber.padEnd(16, "#"));
    		}
    	};

    	return [
    		investor,
    		expDate,
    		cardHolder,
    		ccv,
    		flip,
    		cardNumberElement,
    		expDateElement,
    		cardHolderElement,
    		ccvElement,
    		getSrc,
    		cardNumberData,
    		cardNumber,
    		focusCardNumber,
    		focusExpDateElement,
    		focusCardHolderElement,
    		focusCcvElement,
    		flipCard,
    		div13_binding,
    		div14_binding,
    		div15_binding,
    		div19_binding,
    		div21_binding
    	];
    }

    class CreditCard extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-164z982-style")) add_css();

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			investor: 0,
    			cardNumber: 11,
    			expDate: 1,
    			cardHolder: 2,
    			ccv: 3,
    			focusCardNumber: 12,
    			focusExpDateElement: 13,
    			focusCardHolderElement: 14,
    			focusCcvElement: 15,
    			flipCard: 16
    		});
    	}

    	get focusCardNumber() {
    		return this.$$.ctx[12];
    	}

    	get focusExpDateElement() {
    		return this.$$.ctx[13];
    	}

    	get focusCardHolderElement() {
    		return this.$$.ctx[14];
    	}

    	get focusCcvElement() {
    		return this.$$.ctx[15];
    	}

    	get flipCard() {
    		return this.$$.ctx[16];
    	}
    }

    return CreditCard;

})));

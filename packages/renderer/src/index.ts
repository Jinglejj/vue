import createRenderer from "./renderer";
import VNode from "./vnode";

const vnode: VNode = {
  type: "h1",
  children: "Hello",
};

const renderer = createRenderer<Element>({
  createElement: (tag) => document.createElement(tag),
  setElementText: (el, text) => (el.textContent = text),
  insert: (el, parent, anchor = null) => parent.insertBefore(el, anchor),
});

renderer.render(vnode, document.querySelector("#app"));

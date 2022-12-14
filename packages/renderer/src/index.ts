import { isBoolean, toString } from "lodash-es";
import createRenderer from "./renderer";
import VNode from "./vnode";

const vnode: VNode = {
  type: "button",
  props: {
    disabled: false,
  },
  children: [
    {
      type: "span",
      children: "button",
    },
  ],
};

const renderer = createRenderer<Element>({
  createElement: (tag) => document.createElement(tag),
  setElementText: (el, text) => (el.textContent = text),
  insert: (el, parent, anchor = null) => parent.insertBefore(el, anchor),
  setAttribute: (el, key, value) => {
    if (key in el) {
      //@ts-ignore
      const type = typeof el[key];
      if (type === "boolean" && value === "") {
        //@ts-ignore
        el[key] = true;
      } else {
        //@ts-ignore
        el[key] = value;
      }
    } else {
      el.setAttribute(key, toString(value));
    }
  },
});

renderer.render(vnode, document.querySelector("#app"));

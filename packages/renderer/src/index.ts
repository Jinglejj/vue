import _, { isBoolean, toString } from "lodash-es";
import createRenderer from "./renderer";
import VNode from "./vnode";

const vnode: VNode = {
  type: "button",
  props: {
    disabled: false,
    onClick: () => {
      console.log("click");
    },
  },
  children: [
    {
      type: "span",
      children: "button",
    },
  ],
};

function shouldSetAsProps(el: Element, key: string, value: any) {
  if (key === "form" && el.tagName === "INPUT") {
    return false;
  }
  return key in el;
}

const renderer = createRenderer<Element>({
  createElement: (tag) => document.createElement(tag),
  setElementText: (el, text) => (el.textContent = text),
  insert: (el, parent, anchor = null) => parent.insertBefore(el, anchor),
  patchProps(el, key, prevValue, nextValue) {
    if (/^on/.test(key)) {
      const name = key.slice(2).toLowerCase();
      prevValue && el.removeEventListener(name, prevValue);
      el.addEventListener(name, nextValue);
    } else if (key === "class") {
      el.className = nextValue || "";
    } else if (shouldSetAsProps(el, key, nextValue)) {
      const type = typeof _.get(el, key);
      if (type === "boolean" && nextValue === "") {
        _.set(el, key, true);
      } else {
        _.set(el, key, nextValue);
      }
    } else {
      el.setAttribute(key, toString(nextValue));
    }
  },
});

renderer.render(vnode, document.querySelector("#app"));

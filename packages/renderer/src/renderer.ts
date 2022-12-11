import { isString } from "lodash-es";
import VNode from "./vnode";

type ContainerEl = Element & { _vnode?: VNode };

// 抽离创建元素的API，设计通用的渲染器，适用不同平台
type CreateRendererOptions<E> = {
  createElement: (tag: string) => E;
  setElementText: (el: E, text: string) => void;
  insert: (el: E, parent: E, anchor?: E | null) => void;
};

export default function createRenderer<E>(options: CreateRendererOptions<E>) {
  const { createElement, setElementText, insert } = options;
  function patch(n1: VNode | undefined, n2: VNode, container: E) {
    if (!n1) {
      mountElement(n2, container);
    } else {
      //TODO:
    }
  }

  function render(vnode: VNode, container: (E & { _vnode?: VNode }) | null) {
    if (!container) {
      return;
    }
    if (vnode) {
      patch(container._vnode, vnode, container);
    } else {
      if (container._vnode) {
        setElementText(container, "");
      }
      container._vnode = vnode;
    }
  }

  function mountElement(vnode: VNode, container: E) {
    const el = createElement(vnode.type);
    if (isString(vnode.children)) {
      setElementText(el, vnode.children);
    }
    insert(el, container);
  }

  return {
    render,
  };
}

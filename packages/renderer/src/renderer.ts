import _, { isArray, isObject, isString } from "lodash-es";
import VNode from "./vnode";

// 抽离创建元素的API，设计通用的渲染器，适用不同平台
type CreateRendererOptions<E> = {
  createElement: (tag: string) => E;
  setElementText: (el: E, text: string) => void;
  insert: (el: E, parent: E, anchor?: E | null) => void;
  patchProps: (el: E, key: string, prevValue: any, nextValue: any) => void;
};

export default function createRenderer<E>(options: CreateRendererOptions<E>) {
  const { createElement, setElementText, insert, patchProps } = options;
  function patch(n1: VNode | null, n2: VNode, container: E) {
    if (n1 && n1.type !== n2.type) {
      unmount(n1);
      n1 = null;
    }
    const { type } = n2;
    if (isString(type)) {
      if (!n1) {
        mountElement(n2, container);
      } else {
        //TODO:
      }
    } else if (isObject(type)) {
      // 组件
    }
  }

  function render(vnode: VNode, container: (E & { _vnode: VNode }) | null) {
    if (!container) {
      return;
    }
    if (vnode) {
      patch(container._vnode!, vnode, container);
    } else {
      if (container._vnode) {
        unmount(container._vnode);
      }
      container._vnode = vnode;
    }
  }

  function mountElement(vnode: VNode, container: E) {
    //@ts-ignore
    const el = (vnode.el = createElement(vnode.type));
    const { children, props } = vnode;
    if (isString(children)) {
      setElementText(el, children);
    } else if (isArray(children)) {
      children.forEach((child) => {
        patch(null, child as any, el);
      });
    }

    if (props) {
      for (const key in props) {
        patchProps(el, key, null, _.get(vnode.props, key));
      }
    }

    insert(el, container);
  }

  function unmount(vnode: VNode) {
    const parent = vnode?.el?.parentNode;
    if (parent) {
      parent.removeChild(vnode.el!);
    }
  }

  return {
    render,
  };
}

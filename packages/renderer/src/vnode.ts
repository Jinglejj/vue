type VNodeType = string;

export type ChildVNode = VNode | string;
interface VNode<E = Element> {
  type: VNodeType;
  props?: Record<string, any>;
  children: ChildVNode | ChildVNode[];
  el?: E;
}

export default VNode;

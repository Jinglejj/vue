type VNodeType = string;

export type ChildVNode = VNode | string;
interface VNode {
  type: VNodeType;
  props?: Record<string, string | boolean | number>;
  children: ChildVNode | ChildVNode[];
}

export default VNode;

type VNodeType = string;

interface VNode {
  type: VNodeType;
  children: VNode | VNode[] | string;
}

export default VNode;

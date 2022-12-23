import {
  effect,
  reactive,
  readonly,
  shallowReactive,
  shallowReadonly,
} from "reactivity";

const s = new Set([1, 2, 3]);
const p = reactive(s);

effect(() => {
  console.log(p.size);
});
p.add(5);

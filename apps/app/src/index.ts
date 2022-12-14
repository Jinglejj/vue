import { effect, reactive, readonly, shallowReactive, shallowReadonly } from "reactivity";

const obj = { a: { b: 1 } };
const p = reactive(obj);

effect(() => {
  console.log(p.a.b);
});
p.a.b++;
p.a.b++;

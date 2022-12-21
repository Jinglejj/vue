import {
  effect,
  reactive,
  readonly,
  shallowReactive,
  shallowReadonly,
} from "reactivity";

const obj = {};
const p = reactive<number[]>([]);

effect(() => {
  p.push(1);
});

effect(() => {
  p.push(1);
});

effect(() => {
  console.log(p);
});

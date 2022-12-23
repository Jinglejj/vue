import {
  effect,
  reactive,
  readonly,
  shallowReactive,
  shallowReadonly,
  ref,
} from "reactivity";

// const s = new Set([1, 2, 3]);
// const p = reactive(s);

// effect(() => {
//   console.log(p.size);
// });
// p.add(5);

const refVal = ref(1);

effect(() => {
  console.log(refVal.value);
});
refVal.value = 2;

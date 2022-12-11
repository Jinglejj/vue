import { obj, effect } from "reactivity";
import computed from "reactivity/src/computed";
import flushJob, { jobQueue } from "reactivity/src/queue";

const sum = computed(() => {
  console.log('computed')
  return obj.foo + 1;
});

console.log(sum.value);

console.log(sum.value);

console.log("结束了");

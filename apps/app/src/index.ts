import { obj, effect } from "reactivity";
import flushJob, { jobQueue } from "reactivity/src/queue";

effect(
  () => {
    console.log(obj.foo);
  },
  {
    scheduler(fn) {
      jobQueue.add(fn);
      flushJob();
    },
  }
);
new Array(100).fill(12).forEach(() => {
  obj.foo++;
});

console.log("结束了");

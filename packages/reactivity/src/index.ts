export * from "./effect";

export { default as flushQueue } from "./queue";

import { activeEffect, EffectFunction } from "./effect";

const bucket = new WeakMap<any, Map<any, Set<EffectFunction>>>();

type Key = string | symbol;

const data = {
  text: "Hello World",
  foo: 1,
};

export const obj = new Proxy(data, {
  get(target, key) {
    track(target, key);
    return target[key];
  },
  set(target, key, newVal) {
    target[key] = newVal;
    trigger(target, key);
    return true;
  },
});

function track<T = {}>(target: T, key: Key) {
  if (!activeEffect) {
    return target[key];
  }
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);
  //每次执行时会清楚相关依赖，并重新建立关联。
  activeEffect.deps.push(deps);
}

function trigger<T>(target: T, key: Key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return true;
  const effects = depsMap.get(key) || [];
  [...effects]
    .filter((effectFn) => effectFn !== activeEffect)
    .forEach((fn) => {
      if (fn.options?.scheduler) {
        fn.options.scheduler(fn);
      } else {
        fn();
      }
    });
}

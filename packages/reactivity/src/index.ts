export * from "./effect";
export * from "./computed";

export { default as flushQueue } from "./queue";

import { eq, has } from "lodash-es";
import { activeEffect, EffectFunction } from "./effect";

const bucket = new WeakMap<any, Map<any, Set<EffectFunction>>>();

type Key = string | symbol;

const ITERATE_KEY = "interate_key";

function reactive<T extends Object>(obj: T) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (key === "raw") {
        return target;
      }
      track(target, key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, newVal, receiver) {
      const oldValue = Reflect.get(target, key, receiver);
      const type = has(target, key) ? TriggerType.SET : TriggerType.ADD;
      const res = Reflect.set(target, key, newVal, receiver);
      if (target === receiver.raw && !eq(oldValue, newVal)) {
        trigger(target, key, type);
      }
      return res;
    },
    deleteProperty(target, key) {
      const hadKey = has(target, key);
      const res = Reflect.deleteProperty(target, key);
      if (res && hadKey) {
        trigger(target, key, TriggerType.DELETE);
      }
      return res;
    },
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
    ownKeys(target) {
      track(target, ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
  });
}

export function track<T = {}>(target: T, key: Key) {
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
enum TriggerType {
  ADD = "ADD",
  SET = "SET",
  DELETE = "DELETE",
}
export function trigger<T>(target: T, key: Key, type: TriggerType) {
  const depsMap = bucket.get(target);
  if (!depsMap) return true;
  const effects = depsMap.get(key) || [];
  const iteratorEffects = depsMap.get(ITERATE_KEY) || [];
  const effectToRun: EffectFunction[] = [];
  effectToRun.push(
    ...[...effects].filter((effectFn) => effectFn !== activeEffect)
  );
  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    effectToRun.push(
      ...[...iteratorEffects].filter((effectFn) => effectFn !== activeEffect)
    );
  }
  effectToRun.forEach((fn) => {
    if (fn.options?.scheduler) {
      fn.options.scheduler(fn);
    } else {
      fn();
    }
  });
}

export default reactive;

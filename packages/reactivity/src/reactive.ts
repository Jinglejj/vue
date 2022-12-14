export * from "./effect";
export * from "./computed";

export { default as flushQueue } from "./queue";

import { eq, has, isNull, isObject } from "lodash-es";
import { activeEffect, EffectFunction } from "./effect";

const bucket = new WeakMap<any, Map<any, Set<EffectFunction>>>();

type Key = string | symbol;

const ITERATE_KEY = "interate_key";
type CreateReactiveOptions = {
  isShallow?: boolean;
  isReadonly?: boolean;
};

export function reactive<T extends Object>(obj: T): T {
  return createReactive(obj);
}

export function shallowReactive<T extends Object>(obj: T): T {
  return createReactive(obj, { isShallow: true });
}

export function readonly<T extends Object>(obj: T): T {
  return createReactive(obj, { isReadonly: true });
}
export function shallowReadonly<T extends Object>(obj: T): T {
  return createReactive(obj, { isShallow: true, isReadonly: true });
}

function createReactive<T extends Object>(
  obj: T,
  { isShallow, isReadonly }: CreateReactiveOptions = {}
): T {
  return new Proxy<T>(obj, {
    get(target, key, receiver) {
      if (key === "raw") {
        return target;
      }
      if (!isReadonly) {
        track(target, key);
      }
      const res = Reflect.get(target, key, receiver);
      if (isShallow) {
        return res;
      }
      if (!isNull(res) && isObject(res)) {
        return isReadonly ? readonly(res) : reactive(res);
      }
      return res;
    },
    set(target, key, newVal, receiver) {
      if (isReadonly) {
        console.warn(`${key.toString()} is readonly`);
        return true;
      }
      const oldValue = Reflect.get(target, key, receiver);
      const type = has(target, key) ? TriggerType.SET : TriggerType.ADD;
      const res = Reflect.set(target, key, newVal, receiver);
      if (target === receiver.raw && !eq(oldValue, newVal)) {
        trigger(target, key, type);
      }
      return res;
    },
    deleteProperty(target, key) {
      if (isReadonly) {
        console.warn(`${key.toString()} is readonly`);
        return true;
      }
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
  activeEffect?.deps?.push(deps);
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

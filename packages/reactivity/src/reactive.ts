export * from "./effect";
export * from "./computed";

export { default as flushQueue } from "./queue";

import { eq, has, isArray, isNull, isObject, isSymbol } from "lodash-es";
import { activeEffect, EffectFunction } from "./effect";

const bucket = new WeakMap<any, Map<any, Set<EffectFunction>>>();

const reactiveMap = new WeakMap<any, any>();

type Key = string | symbol;

const ITERATE_KEY = "interate_key";
type CreateReactiveOptions = {
  isShallow?: boolean;
  isReadonly?: boolean;
};

export function reactive<T extends Object>(obj: T): T {
  const existionProxy = reactiveMap.get(obj);
  if (existionProxy) {
    return existionProxy;
  }

  const proxy = createReactive(obj);
  reactiveMap.set(obj, proxy);
  return proxy;
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

type ArrayInstrumentation = {
  raw?: any;
  [key: string]: any;
};

const arrayInstrumentations: ArrayInstrumentation = {};

["includes", "indexOf", "lastIndexOf"].forEach((method) => {
  const originMethod = Array.prototype[method as any];
  arrayInstrumentations[method] = function (...args: any) {
    let res = originMethod.apply(this, args);
    if (res === false) {
      res = originMethod.apply(this.raw, args);
    }
    return res;
  };
});

let shouldTrack = true;
["pop", "push", "shift", "unshift", "splice"].forEach((method) => {
  const originMethod = Array.prototype[method as any];
  arrayInstrumentations[method] = function (...args: any) {
    shouldTrack = false;
    let res = originMethod.apply(this, args);
    shouldTrack = true;
    return res;
  };
});

function createReactive<T extends Object>(
  obj: T,
  { isShallow, isReadonly }: CreateReactiveOptions = {}
): T {
  return new Proxy<T>(obj, {
    get(target, key, receiver) {
      if (key === "raw") {
        return target;
      }

      if (isArray(obj) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }

      if (!isReadonly && !isSymbol(key)) {
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
      const type = isArray(target)
        ? Number(key) < target.length
          ? TriggerType.SET
          : TriggerType.ADD
        : has(target, key)
        ? TriggerType.SET
        : TriggerType.ADD;
      const res = Reflect.set(target, key, newVal, receiver);
      if (target === receiver.raw && !eq(oldValue, newVal)) {
        trigger(target, key, type, newVal);
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
      track(target, isArray(target) ? "length" : ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
  });
}

export function track<T = {}>(target: T, key: Key) {
  if (!activeEffect || !shouldTrack) {
    return;
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
export function trigger<T>(
  target: T,
  key: Key,
  type: TriggerType,
  newValue?: any
) {
  const depsMap = bucket.get(target);
  if (!depsMap) return true;
  const effects = depsMap.get(key) || [];
  const iteratorEffects = depsMap.get(ITERATE_KEY) || [];
  const effectToRun = new Set<EffectFunction>();
  effects?.forEach((effectFn) => {
    if (effectFn !== activeEffect) {
      effectToRun.add(effectFn);
    }
  });

  if (type === TriggerType.ADD && isArray(target)) {
    const lengthEffects = depsMap.get("length");
    lengthEffects?.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectToRun.add(effectFn);
      }
    });
  }
  if (isArray(target) && key === "length") {
    depsMap.forEach((effects, key) => {
      if (key >= newValue) {
        effects?.forEach((effectFn) => {
          if (effectFn !== activeEffect) {
            effectToRun.add(effectFn);
          }
        });
      }
    });
  }
  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    iteratorEffects?.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectToRun.add(effectFn);
      }
    });
  }
  effectToRun.forEach((fn) => {
    if (fn.options?.scheduler) {
      fn.options.scheduler(fn);
    } else {
      fn();
    }
  });
}

import { forOwn, isFunction, isNull, isObject } from "lodash-es";
import { effect } from "./effect";

type WatchOption = {
  immediate?: boolean;
  flush?: "pre" | "post" | "sync";
};

function watch(
  source: any,
  cb: (
    newValue: any,
    oldValue: any,
    onInvalidate?: (fn: Function) => void
  ) => void,
  options?: WatchOption
) {
  let getter: Function;
  if (isFunction(source)) {
    getter = source;
  } else {
    getter = () => traverse(source);
  }

  let oldValue: any, newValue: any;
  let cleanup: Function;

  function onInvalidate(fn: Function) {
    cleanup = fn();
  }

  const job = () => {
    newValue = effectFn();
    if (cleanup) {
      cleanup();
    }
    cb(newValue, oldValue, onInvalidate);
    oldValue = newValue;
  };

  const effectFn = effect(() => getter?.(), {
    lazy: true,
    scheduler() {
      if (options?.flush === "post") {
        const p = Promise.resolve();
        p.then(job);
      } else {
        job();
      }
    },
  });

  if (options?.immediate) {
    job();
  } else {
    oldValue = effectFn();
  }
}

function traverse(value: any, seen = new Set()) {
  if (!isObject(value) || isNull(value) || seen.has(value)) {
    return;
  }
  seen.add(value);
  forOwn(value, (v) => traverse(v, seen));
  return value;
}

export default watch;

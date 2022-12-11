import { forOwn, isFunction, isNull, isObject } from "lodash-es";
import { effect } from "./effect";

type WatchOption = {
  immediate?: boolean;
};

function watch(
  source: any,
  cb: (newValue: any, oldValue: any) => void,
  options?: WatchOption
) {
  let getter: Function;
  if (isFunction(source)) {
    getter = source;
  } else {
    getter = () => traverse(source);
  }

  let oldValue: any, newValue: any;

  const job = () => {
    newValue = effectFn();
    cb(newValue, oldValue);
    oldValue = newValue;
  };

  const effectFn = effect(() => getter?.(), {
    lazy: true,
    scheduler: job,
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

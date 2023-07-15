import { get } from 'lodash-es';
import { reactive } from './reactive';
function ref<T>(val: T) {
  const wrapper = {
    value: val,
  };
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
  });
  return reactive(wrapper);
}

export function toRef(obj: any, key: any) {
  const wrapper = {
    get value() {
      return obj[key];
    },
    set value(val) {
      obj[key] = val;
    },
  };
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
  });
  return wrapper;
}

export function proxyRefs<T extends object>(target: T): T {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      // @ts-ignore
      return value.__v_isRef ? value.value : value;
    },
    set(target, key, newValue, receiver) {
      const value = get(target, key);
      if (value.__v_isRef) {
        value.value = newValue;
        return true;
      }
      return Reflect.set(target, key, newValue, receiver);
    },
  });
}

export default ref;

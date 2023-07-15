import { track, trigger } from '.';
import { effect, EffectFunction } from './effect';
function computed(fn: EffectFunction) {
  let value;
  let dirty = true;
  const effectFn = effect(fn, {
    lazy: true,
    scheduler() {
      if (!dirty) {
        dirty = true;
        trigger(obj, 'value');
      }
    },
  });

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn();
        dirty = false;
      }
      track(obj, 'value');
      return value;
    },
  };

  return obj;
}

export default computed;

type EffectOption = {
  scheduler: (fn: EffectFunction) => void;
};

export type EffectFunction = Function & {
  deps: Set<Function>[];
  options?: EffectOption;
};

export let activeEffect: EffectFunction;
export const effectStack: EffectFunction[] = [];

function cleanup(effectFn: EffectFunction) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

export function effect(fn: EffectFunction, options?: EffectOption) {
  const effectFn: EffectFunction = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(effectFn);
    const res = fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  };
  effectFn.deps = [];
  effectFn.options = options;
  effectFn();
  return effectFn;
}

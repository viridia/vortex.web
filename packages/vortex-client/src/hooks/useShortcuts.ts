import hotkeys from 'hotkeys-js';
import { useEffect, useState } from "react";

interface Options {
  scope?: string;
  element?: HTMLElement;
  scopeActive?: boolean;
}

interface KeyMap {
  [key: string]: () => void;
}

function keyMapsEqual(a: KeyMap, b: KeyMap) {
  const keys = Object.getOwnPropertyNames(a);
  if (keys.length !== Object.getOwnPropertyNames(b).length) {
    return;
  }

  for (const key of keys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

export const useShortcuts = (keys: KeyMap, options: Options = {}) => {
  const [keyMap, setKeyMap] = useState<KeyMap>({});
  const { scope, element, scopeActive = true } = options;

  // Prevent unnecessary keymap churn.
  useEffect(() => {
    if (!keyMapsEqual(keys, keyMap)) {
      setKeyMap(keys);
    }
  }, [keyMap, keys]);

  // Bind keys to callback functions.
  useEffect(() => {
    const keyNames = Object.getOwnPropertyNames(keyMap).join(',');
    if (keyNames.length > 0) {
      hotkeys(keyNames, { scope, element }, (event, handler) => {
        keyMap[handler.key]();
      });

      return () => {
        if (scope) {
          hotkeys.unbind(keyNames, scope);
        } else {
          hotkeys.unbind(keyNames);
        }
      }
    }
  }, [element, keyMap, scope]);

  // Active a new scope if the scope option was present.
  useEffect(() => {
    if (scopeActive && scope && scope !== hotkeys.getScope()) {
      const savedScope = hotkeys.getScope();
      hotkeys.setScope(scope);
      return () => {
        hotkeys.setScope(savedScope);
      }
    }
  }, [scope, scopeActive]);
};

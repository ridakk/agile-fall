import { useState, useEffect } from 'react';

export default function usePersistentState(key, initialValue, postProcessor) {
  const [value, setValue] = useState(() => {
    const persistentValue = localStorage.getItem(key);

    if (!persistentValue) {
      return initialValue;
    }

    const parsedValue = JSON.parse(persistentValue);

    if (postProcessor) {
      return postProcessor(parsedValue);
    }

    return parsedValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

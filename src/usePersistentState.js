import { useState, useEffect } from 'react';

export default function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const persistentValue = localStorage.getItem(key);

    return persistentValue ? JSON.parse(persistentValue) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

import { createContext } from 'react';

export default createContext({
  developmentDays: 10 * 0.6,
  setDevelopmentDays: () => {},
});

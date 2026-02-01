// Jest setup file for store and utility testing

// Mock AsyncStorage for zustand persist
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Silence console warnings in tests
const originalWarn = console.warn;
const originalError = console.error;
global.console = {
  ...console,
  warn: (...args) => {
    if (!args[0]?.includes?.('zustand')) {
      originalWarn.apply(console, args);
    }
  },
  error: (...args) => {
    if (!args[0]?.includes?.('Warning')) {
      originalError.apply(console, args);
    }
  },
};

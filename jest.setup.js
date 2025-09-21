// Jest setup file for additional configuration
require('@testing-library/jest-dom');

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Setup fetch mock
global.fetch = jest.fn();

// Setup AbortController mock for older Node versions
if (!global.AbortController) {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
    }
    
    abort() {
      this.signal.aborted = true;
    }
  };
}

// Setup performance.now mock if needed
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now()),
  };
}
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Limpieza automática después de cada test
afterEach(() => {
  cleanup();
});

import "@testing-library/jest-dom/vitest"
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

declare module "vitest" {
  // jest-dom types extend `Assertion`, which Vitest 5 only re-exports, so register them on `Matchers`.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Matchers<R, T> extends TestingLibraryMatchers<unknown, R> {}
}

afterEach(cleanup)

// Browser-safe subset of Node's async_hooks API used by TanStack Start.
// Vite externalizes node:async_hooks in browser builds, which leaves
// AsyncLocalStorage undefined. TanStack only needs run/getStore here.
export class AsyncLocalStorage<T = unknown> {
  private store: T | undefined

  getStore(): T | undefined {
    return this.store
  }

  run<R>(store: T, callback: (...args: never[]) => R, ...args: never[]): R {
    const previous = this.store
    this.store = store
    try {
      return callback(...args)
    } finally {
      this.store = previous
    }
  }
}

export default { AsyncLocalStorage }

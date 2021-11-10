import { Ok, Err } from 'ts-results'

class AssertionError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new AssertionError(message)
  }
}

export function assertEnv(v: string): string {
  const res = process.env[v]

  assert(
    typeof res === 'string',
    `Environment variable ${v} has to be set before starting this program`,
  )

  return res
}

// Like Array.prototype.filter. Invariant: only 1 result
export function findOne(predicate: any, xs: any[]) {
  const result = xs.filter(predicate)
  if (result.length === 0) {
    return new Err(`findOne found no results`)
  } else if (result.length === 1) {
    return new Ok(result[0])
  } else {
    return new Err('findOne found multiple results')
  }
}

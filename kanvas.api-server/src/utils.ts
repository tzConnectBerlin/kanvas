require('dotenv').config()

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

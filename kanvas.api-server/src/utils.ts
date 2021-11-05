class AssertionError extends Error {
    constructor(message: string) {
        super(message)
    }
}

let assert = (condition: boolean, message: string) => {
    if (condition) {
        return true
    } else {
        throw new AssertionError(message)
    }
}

export { assert }

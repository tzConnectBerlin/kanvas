/**
 * S-expression parser
 *
 * Recursive descent parser of a simplified sub-set of s-expressions.
 *
 * NOTE: the format of the programs is used in the "Essentials of interpretation"
 * course: https://github.com/DmitrySoshnikov/Essentials-of-interpretation
 *
 * Grammar:
 *
 *   s-exp : atom
 *         | list
 *
 *   list : '(' list-entries ')'
 *
 *   list-entries : s-exp list-entries
 *                | ε
 *
 *   atom : symbol
 *        | number
 *
 * Examples:
 *
 *   (+ 10 5)
 *   > ['+', 10, 5]
 *
 *   (define (fact n)
 *     (if (= n 0)
 *       1
 *       (* n (fact (- n 1)))))
 *
 *   >
 *   ['define', ['fact', 'n'],
 *     ['if', ['=', 'n', 0],
 *       1,
 *       ['*', 'n', ['fact', ['-', 'n', 1]]]]]
 *
 * Forked in 2021 from code written by
 * by Dmitry Soshnikov <dmitry.soshnikov@gmail.com>
 * MIT Style License, 2016
 */

'use strict'
import { compose, not, equals } from 'ramda'
/**
 * Parses a recursive s-expression into
 * equivalent Array representation in JS.
 */
const SExpressionParser = {
  // @ts-ignore
  parse(expression: any) {
    // @ts-ignore
    this._expression = expression
    // @ts-ignore
    this._cursor = 0
    // @ts-ignore
    this._ast = []

    return this._parseExpression()
  },

  /**
   * s-exp : atom
   *       | list
   */
  // @ts-ignore
  _parseExpression() {
    this._whitespace()

    // @ts-ignore
    if (this._expression[this._cursor] === '(') {
      return this._parseList()
    }

    return this._parseAtom()
  },

  /**
   * list : '(' list-entries ')'
   */
  // @ts-ignore
  _parseList() {
    // Allocate a new (sub-)list.
    // @ts-ignore
    this._ast.push([])

    this._expect('(')
    this._parseListEntries()
    this._expect(')')
    // @ts-ignore
    return this._ast[0]
  },

  /**
   * list-entries : s-exp list-entries
   *              | ε
   */
  // @ts-ignore
  _parseListEntries() {
    this._whitespace()

    // ε
    // @ts-ignore
    if (this._expression[this._cursor] === ')') {
      return
    }

    // s-exp list-entries

    let entry = this._parseExpression()

    if (entry !== '') {
      // Lists may contain nested sub-lists. In case we have parsed a nested
      // sub-list, it should be on top of the stack (see `_parseList` where we
      // allocate a list and push it onto the stack). In this case we don't
      // want to push the parsed entry to it (since it's itself), but instead
      // pop it, and push to previous (parent) entry.

      if (Array.isArray(entry)) {
        // @ts-ignore
        entry = this._ast.pop()
      }
      // @ts-ignore
      this._ast[this._ast.length - 1].push(entry)
    }

    return this._parseListEntries()
  },

  /**
   * atom : symbol
   *      | number
   */
  _parseAtom() {
    const terminator = /\s+|\)/
    let atom = ''
    // @ts-ignore
    while (
      // @ts-ignore
      this._expression[this._cursor] && // @ts-ignore
      !terminator.test(this._expression[this._cursor])
    ) {
      // @ts-ignore
      atom += this._expression[this._cursor] // @ts-ignore
      this._cursor++
    }
    // @ts-ignore
    if (atom !== '' && !isNaN(atom)) {
      // @ts-ignore
      atom = Number(atom)
    }

    return atom
  },

  _whitespace() {
    const ws = /^\s+/ // @ts-ignore
    while (
      // @ts-ignore
      this._expression[this._cursor] && // @ts-ignore
      ws.test(this._expression[this._cursor])
    ) {
      // @ts-ignore
      this._cursor++
    }
  },
  // @ts-ignore
  _expect(c) {
    // @ts-ignore
    if (this._expression[this._cursor] !== c) {
      throw new Error(
        // @ts-ignore
        `Unexpected token: ${this._expression[this._cursor]}, expected ${c}.`,
      )
    } // @ts-ignore
    this._cursor++
  },
}

function cutStringUntil(predicate: any, source: string) {
  let i = 0
  while (not(predicate(source[i]))) {
    i++
  }
  return source.substring(i)
}

export function stripPrecedingWhitespace(source: string) {
  return source[0] == ' ' // @ts-ignore
    ? cutStringUntil(compose(not, equals(' ')), source)
    : source
}

export function stripJunk(source: string) {
  return stripPrecedingWhitespace(
    source.replace(/;.*\n/gm, '\n').replace(/\s*$/gm, ''),
  )
}

export function parse(source: string) {
  return SExpressionParser.parse(source)
}

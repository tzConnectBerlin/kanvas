import { parse, stripJunk } from './s_expression'

describe('S-Expression parsing', () => {
  it('strips away comments until end of line', () => {
    expect(
      stripJunk(`   ; comment
rest of source`),
    ).toBe('\nrest of source')
  })
  it('parses the empty list', () => {
    expect(parse(`()`)).toEqual([])
  })

  const result = parse(`atom`)
  it('parses an atom', () => {
    expect(result).toEqual('atom') // God damn it typescript - you know it's valid
  })

  function test(source: string, expected: any) {
    expect(parse(source)).toEqual(expected)
  }

  // Empty lists.
  test(`()`, [])
  test(`( )`, [])
  test(`( ( ) )`, [[]])

  // Simple atoms.
  test(`1`, 1)
  test(`foo`, 'foo')

  // Non-empty and nested lists.
  test(`(+ 1 15)`, ['+', 1, 15])

  test(`(* (+ 1 15) (- 15 2))`, ['*', ['+', 1, 15], ['-', 15, 2]])

  test(
    `
  (define (fact n)
    (if (= n 0)
      1
      (* n (fact (- n 1)))))`,

    [
      'define',
      ['fact', 'n'],
      ['if', ['=', 'n', 0], 1, ['*', 'n', ['fact', ['-', 'n', 1]]]],
    ],
  )

  test(`(define foo 'test')`, ['define', 'foo', `'test'`])
})

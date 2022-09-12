/* globals describe it */

import assert from 'assert'

import gibAuszeichnung from '../dist/auszeichnungssprache.js'

function setze (auszeichnungssprache) {
  const a = gibAuszeichnung(auszeichnungssprache)
  const kontainer = a.kontainer()
  kontainer.komponenten = a.überschrift('Lorem')
  const liste1 = a.liste()
  liste1.komponenten = a.link('Link', 'http://example.com')

  const liste2 = a.liste()

  liste2.komponenten = a.kontainer('Text')
  liste1.komponenten = liste2
  kontainer.komponenten = liste1
  return kontainer.auszeichnung
}

describe('auszeichnungssprache.ts', function () {
  it('Markdown', function () {
    assert.strictEqual(
      setze('markdown'),
      '# Lorem\n\n- [Link](http://example.com)\n    - Text'
    )
  })

  it('TeX', function () {
    assert.strictEqual(
      setze('tex'),
      '\\part{Lorem}\n' +
        '\n' +
        '\\begin{itemize}\n' +
        '\\item \\href{Link}{http://example.com}\n' +
        '\\item \n' +
        '\\begin{itemize}\n' +
        '\\item Text\n' +
        '\\end{itemize}\n' +
        '\\end{itemize}'
    )
  })
})

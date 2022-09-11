/* globals describe it */

import assert from 'assert'

import { gibAuszeichnung } from '../dist/auszeichnungssprache.js'

function setze (auszeichnungssprache) {
  const a = gibAuszeichnung(auszeichnungssprache)
  const kontainer = a.kontainer()
  kontainer.fügeHinzu(a.überschrift('Lorem'))
  const liste1 = a.liste()
  liste1.fügeHinzu(a.link('Link', 'http://example.com'))

  const liste2 = a.liste()

  liste2.fügeHinzu(a.kontainer('Text'))
  liste1.fügeHinzu(liste2)
  kontainer.fügeHinzu(liste1)
  return kontainer.gibAuszeichnung()
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
      '\\section{Lorem}\n' +
        '\n' +
        '\\begin{itemize}\n' +
        '\\item \\href{Link}{http://example.com}\n' +
        '\\item \\begin{itemize}\n' +
        '\\item Text\n' +
        '\\end{itemize}\n' +
        '\\end{itemize}'
    )
  })
})

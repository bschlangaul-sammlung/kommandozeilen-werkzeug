/**
 * Einfaches Markup (= Auszeichnungssprache) sowohl als HTML als auch als
 * TeX erzeugen.
 */

abstract class Komponente {
  abstract gibAuszeichnung (): string
}

abstract class Kompositum extends Komponente {
  komponenten: Komponente[] = []

  fügeHinzu (komponente: Komponente): void {
    this.komponenten.push(komponente)
  }

  abstract gibAuszeichnung (): string
}

class Kontainer extends Kompositum {
  private readonly text?: string

  constructor (text?: string) {
    super()
    this.text = text
  }

  gibAuszeichnung (): string {
    const ausgabe: string[] = []
    if (this.text != null) {
      ausgabe.push(this.text)
    }
    for (const komponente of this.komponenten) {
      ausgabe.push(komponente.gibAuszeichnung())
    }
    return ausgabe.join('\n')
  }
}

abstract class Liste extends Kompositum {
  public ebene: number = 1

  abstract gibAuszeichnung (): string

  fügeHinzu (komponente: Komponente): void {
    if (komponente instanceof Liste) {
      komponente.ebene = this.ebene + 1
    }

    this.komponenten.push(komponente)
  }
}

abstract class Überschrift extends Komponente {
  protected text: string

  constructor (text: string) {
    super()
    this.text = text
  }

  abstract gibAuszeichnung (): string
}

abstract class Link extends Komponente {
  protected readonly text: string

  protected readonly url: string

  constructor (text: string, url: string) {
    super()
    this.text = text
    this.url = url
  }

  abstract gibAuszeichnung (): string
}

class MarkdownListe extends Liste {
  gibAuszeichnung (): string {
    const ausgabe: string[] = []
    for (const komponente of this.komponenten) {
      if (komponente instanceof MarkdownListe) {
        ausgabe.push(komponente.gibAuszeichnung())
      } else {
        ausgabe.push(
          ' '.repeat(4 * (this.ebene - 1)) + '- ' + komponente.gibAuszeichnung()
        )
      }
    }
    return ausgabe.join('\n')
  }
}

class MarkdownÜberschrift extends Überschrift {
  gibAuszeichnung (): string {
    return '# ' + this.text + '\n'
  }
}

class MarkdownLink extends Link {
  gibAuszeichnung (): string {
    return '[' + this.text + '](' + this.url + ')'
  }
}

class TexListe extends Liste {
  gibAuszeichnung (): string {
    const ausgabe: string[] = []
    for (const komponente of this.komponenten) {
      ausgabe.push('\\item ' + komponente.gibAuszeichnung())
    }
    return '\\begin{itemize}\n' + ausgabe.join('\n') + '\n\\end{itemize}'
  }
}

class TexÜberschrift extends Überschrift {
  gibAuszeichnung (): string {
    return '\\section{' + this.text + '}\n'
  }
}

class TexLink extends Link {
  gibAuszeichnung (): string {
    return '\\href{' + this.text + '}{' + this.url + '}'
  }
}

abstract class Fabrik {
  kontainer (text?: string): Kontainer {
    return new Kontainer(text)
  }

  abstract liste (): Liste

  abstract überschrift (text: string): Überschrift

  abstract link (text: string, url: string): Link
}

class TexFabrik extends Fabrik {
  liste (): Liste {
    return new TexListe()
  }

  überschrift (text: string): Überschrift {
    return new TexÜberschrift(text)
  }

  link (text: string, url: string): Link {
    return new TexLink(text, url)
  }
}

class MarkdownFabrik extends Fabrik {
  liste (): Liste {
    return new MarkdownListe()
  }

  überschrift (text: string): Überschrift {
    return new MarkdownÜberschrift(text)
  }

  link (text: string, url: string): Link {
    return new MarkdownLink(text, url)
  }
}

export function gibAuszeichnung (
  auszeichnungssprache: 'markdown' | 'tex'
): Fabrik {
  if (auszeichnungssprache === 'tex') {
    return new TexFabrik()
  }
  return new MarkdownFabrik()
}

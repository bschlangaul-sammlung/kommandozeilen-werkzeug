/**
 * Einfaches Markup (= Auszeichnungssprache) sowohl als HTML als auch als
 * TeX erzeugen.
 */

abstract class Komponente {
  public abstract get auszeichnung (): string
}

abstract class Kompositum extends Komponente {
  protected komponenten_: Komponente[] = []

  protected fügeHinzu (komponente: Komponente): void {
    this.komponenten_.push(komponente)
  }

  public get komponenten (): Komponente[] {
    return this.komponenten_
  }

  public set komponenten (komponenten: Komponente | Komponente[]) {
    if (!Array.isArray(komponenten)) {
      komponenten = [komponenten]
    }

    for (const komponente of komponenten) {
      this.fügeHinzu(komponente)
    }
  }

  public abstract get auszeichnung (): string
}

class Kontainer extends Kompositum {
  private readonly text?: string

  constructor (text?: string) {
    super()
    this.text = text
  }

  public get auszeichnung (): string {
    const ausgabe: string[] = []
    if (this.text != null) {
      ausgabe.push(this.text)
    }
    for (const komponente of this.komponenten_) {
      ausgabe.push(komponente.auszeichnung)
    }
    return ausgabe.join('')
  }
}

abstract class Liste extends Kompositum {
  public ebene: number = 1

  public abstract get auszeichnung (): string

  fügeHinzu (komponente: Komponente): void {
    if (komponente instanceof Liste) {
      komponente.ebene = this.ebene + 1
    }
    this.komponenten_.push(komponente)
  }
}

class Text extends Komponente {
  private readonly text: string

  constructor (text: string) {
    super()
    this.text = text
  }

  public get auszeichnung (): string {
    return this.text
  }
}

abstract class Überschrift extends Komponente {
  public ebene: number

  protected text: string

  constructor (text: string, ebene: number = 1) {
    super()
    this.text = text
    this.ebene = ebene
  }

  public abstract get auszeichnung (): string
}

abstract class Link extends Komponente {
  protected readonly text: string

  protected readonly url: string

  constructor (text: string, url: string) {
    super()
    this.text = text
    this.url = url
  }

  public abstract get auszeichnung (): string
}

class MarkdownListe extends Liste {
  public get auszeichnung (): string {
    const ausgabe: string[] = []
    for (const komponente of this.komponenten_) {
      const einrückung =
        komponente instanceof MarkdownListe
          ? ''
          : '\n' + ' '.repeat(4 * (this.ebene - 1)) + '- '
      ausgabe.push(einrückung + komponente.auszeichnung)
    }
    return ausgabe.join('')
  }
}

class MarkdownÜberschrift extends Überschrift {
  public get auszeichnung (): string {
    return '#'.repeat(this.ebene) + ' ' + this.text + '\n'
  }
}

class MarkdownLink extends Link {
  public get auszeichnung (): string {
    return '[' + this.text + '](' + this.url + ')'
  }
}

class TexListe extends Liste {
  public get auszeichnung (): string {
    const ausgabe: string[] = []
    for (const komponente of this.komponenten_) {
      ausgabe.push('\\item ' + komponente.auszeichnung)
    }
    return '\n\\begin{itemize}\n' + ausgabe.join('\n') + '\n\\end{itemize}'
  }
}

function erzeugeTexÜberschrift (text: string, ebene: number = 3): string {
  let makro: string
  switch (ebene) {
    case 1:
      makro = 'part'
      break

    case 2:
      makro = 'chapter'
      break

    case 3:
      makro = 'section'
      break

    case 4:
      makro = 'subsection'
      break

    case 5:
      makro = 'subsubsection'
      break

    case 6:
      makro = 'subsubsubsection'
      break

    default:
      makro = 'section'
      break
  }
  return `\\${makro}{${text}}\n`
}

class TexÜberschrift extends Überschrift {
  public get auszeichnung (): string {
    return erzeugeTexÜberschrift(this.text, this.ebene)
  }
}

class TexLink extends Link {
  public get auszeichnung (): string {
    return '\\href{' + this.text + '}{' + this.url + '}'
  }
}

abstract class Fabrik {
  public kontainer (text?: string): Kontainer {
    return new Kontainer(text)
  }

  public abstract liste (): Liste

  public text (text: string): Text {
    return new Text(text)
  }

  public abstract überschrift (text: string, ebene?: number): Überschrift

  public abstract link (text: string, url: string): Link
}

class TexFabrik extends Fabrik {
  public liste (): Liste {
    return new TexListe()
  }

  public überschrift (text: string, ebene: number = 1): Überschrift {
    return new TexÜberschrift(text, ebene)
  }

  public link (text: string, url: string): Link {
    return new TexLink(text, url)
  }
}

class MarkdownFabrik extends Fabrik {
  public liste (): Liste {
    return new MarkdownListe()
  }

  public überschrift (text: string, ebene: number = 1): Überschrift {
    return new MarkdownÜberschrift(text, ebene)
  }

  public link (text: string, url: string): Link {
    return new MarkdownLink(text, url)
  }
}

export default function (auszeichnung: 'markdown' | 'tex'): Fabrik {
  if (auszeichnung === 'tex') {
    return new TexFabrik()
  }
  return new MarkdownFabrik()
}

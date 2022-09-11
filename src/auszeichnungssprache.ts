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

abstract class Liste extends Kompositum {
  abstract gibAuszeichnung (): string
}

abstract class Überschrift implements Komponente {
  text: string

  constructor (text: string) {
    this.text = text
  }

  abstract gibAuszeichnung (): string
}

abstract class Link implements Komponente {
  text: string
  url: string

  constructor (text: string, url: string) {
    this.text = text
    this.url = url
  }

  abstract gibAuszeichnung (): string
}

class MarkdownListe extends Liste {
  gibAuszeichnung (): string {
    const ausgabe: string[] = []
    for (const komponente of this.komponenten) {
      ausgabe.push(komponente.gibAuszeichnung())
    }
    return ausgabe.join('\n')
  }
}

class MarkdownÜberschrift extends Überschrift {
  gibAuszeichnung (): string {
    return '\\section{' + this.text + '}'
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
      ausgabe.push(komponente.gibAuszeichnung())
    }
    return ausgabe.join('\n')
  }
}

class TexÜberschrift extends Überschrift {
  gibAuszeichnung (): string {
    return '\\section{' + this.text + '}'
  }
}

class TexLink extends Link {
  gibAuszeichnung (): string {
    return '\\ref{' + this.text + '}{' + this.url + '}'
  }
}

abstract class Fabrik {
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

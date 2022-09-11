/**
 * Einfaches Markup (= Auszeichnungssprache) sowohl als HTML als auch als
 * TeX erzeugen.
 */
class Komponente {
}
class Kompositum extends Komponente {
    constructor() {
        super(...arguments);
        this.komponenten = [];
    }
    fügeHinzu(komponente) {
        this.komponenten.push(komponente);
    }
}
class Kontainer extends Kompositum {
    constructor(text) {
        super();
        this.text = text;
    }
    gibAuszeichnung() {
        const ausgabe = [];
        if (this.text != null) {
            ausgabe.push(this.text);
        }
        for (const komponente of this.komponenten) {
            ausgabe.push(komponente.gibAuszeichnung());
        }
        return ausgabe.join('\n');
    }
}
class Liste extends Kompositum {
    constructor() {
        super(...arguments);
        this.ebene = 1;
    }
    fügeHinzu(komponente) {
        if (komponente instanceof Liste) {
            komponente.ebene = this.ebene + 1;
        }
        this.komponenten.push(komponente);
    }
}
class Überschrift extends Komponente {
    constructor(text) {
        super();
        this.text = text;
    }
}
class Link extends Komponente {
    constructor(text, url) {
        super();
        this.text = text;
        this.url = url;
    }
}
class MarkdownListe extends Liste {
    gibAuszeichnung() {
        const ausgabe = [];
        for (const komponente of this.komponenten) {
            if (komponente instanceof MarkdownListe) {
                ausgabe.push(komponente.gibAuszeichnung());
            }
            else {
                ausgabe.push(' '.repeat(4 * (this.ebene - 1)) + '- ' + komponente.gibAuszeichnung());
            }
        }
        return ausgabe.join('\n');
    }
}
class MarkdownÜberschrift extends Überschrift {
    gibAuszeichnung() {
        return '# ' + this.text + '\n';
    }
}
class MarkdownLink extends Link {
    gibAuszeichnung() {
        return '[' + this.text + '](' + this.url + ')';
    }
}
class TexListe extends Liste {
    gibAuszeichnung() {
        const ausgabe = [];
        for (const komponente of this.komponenten) {
            ausgabe.push('\\item ' + komponente.gibAuszeichnung());
        }
        return '\\begin{itemize}\n' + ausgabe.join('\n') + '\n\\end{itemize}';
    }
}
class TexÜberschrift extends Überschrift {
    gibAuszeichnung() {
        return '\\section{' + this.text + '}\n';
    }
}
class TexLink extends Link {
    gibAuszeichnung() {
        return '\\href{' + this.text + '}{' + this.url + '}';
    }
}
class Fabrik {
    kontainer(text) {
        return new Kontainer(text);
    }
}
class TexFabrik extends Fabrik {
    liste() {
        return new TexListe();
    }
    überschrift(text) {
        return new TexÜberschrift(text);
    }
    link(text, url) {
        return new TexLink(text, url);
    }
}
class MarkdownFabrik extends Fabrik {
    liste() {
        return new MarkdownListe();
    }
    überschrift(text) {
        return new MarkdownÜberschrift(text);
    }
    link(text, url) {
        return new MarkdownLink(text, url);
    }
}
export function gibAuszeichnung(auszeichnungssprache) {
    if (auszeichnungssprache === 'tex') {
        return new TexFabrik();
    }
    return new MarkdownFabrik();
}
//# sourceMappingURL=auszeichnungssprache.js.map
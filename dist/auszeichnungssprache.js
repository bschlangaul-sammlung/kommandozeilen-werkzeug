"use strict";
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
class Liste extends Kompositum {
}
class Überschrift {
    constructor(text) {
        this.text = text;
    }
}
class Link {
    constructor(text, url) {
        this.text = text;
        this.url = url;
    }
}
class MarkdownListe extends Liste {
    gibAuszeichnung() {
        const ausgabe = [];
        for (const komponente of this.komponenten) {
            ausgabe.push(komponente.gibAuszeichnung());
        }
        return ausgabe.join('\n');
    }
}
class MarkdownÜberschrift extends Überschrift {
    gibAuszeichnung() {
        return '\\section{' + this.text + '}';
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
            ausgabe.push(komponente.gibAuszeichnung());
        }
        return ausgabe.join('\n');
    }
}
class TexÜberschrift extends Überschrift {
    gibAuszeichnung() {
        return '\\section{' + this.text + '}';
    }
}
class TexLink extends Link {
    gibAuszeichnung() {
        return '\\ref{' + this.text + '}{' + this.url + '}';
    }
}
class Fabrik {
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
//# sourceMappingURL=auszeichnungssprache.js.map
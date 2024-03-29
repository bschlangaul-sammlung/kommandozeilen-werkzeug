import path from 'path';
function formatierteLänge(länge, spiegeln = false) {
    if (spiegeln) {
        länge = länge * -1;
    }
    länge = Math.round((länge / 70) * 100) / 100;
    return `${länge}cm`;
}
function formatiereZustandsName(zustand) {
    let name = zustand.Name;
    const regExp = /^(z|q)(\d+)$/;
    if (name.match(regExp) != null) {
        name = name.replace(regExp, '$1_$2');
        name = `$${name}$`;
    }
    return name;
}
function formatiereZustand(state) {
    let additionsOptions = '';
    if (state.Start)
        additionsOptions = ',initial';
    if (state.Final)
        additionsOptions = additionsOptions + ',accepting';
    const name = formatiereZustandsName(state);
    const koordinate = `at (${formatierteLänge(state.x)},${formatierteLänge(state.y, true)})`;
    return `  \\node[state${additionsOptions}] (${state.Name}) ${koordinate} {${name}};`;
}
function formatiereÜbergang(trans, states) {
    const source = states[trans.Source];
    const target = states[trans.Target];
    const eingabeSymbole = '$' +
        trans.Labels.map(value => {
            if (value === '')
                return '\\varepsilon';
            return value;
        }).join(',') +
        '$';
    const optionen = bestimmeÜbergangsOptionen(trans);
    return `  \\path (${source}) edge${formatiereOptionen(optionen)} node{${eingabeSymbole}} (${target});`;
}
function bestimmeÜbergangsOptionen(trans, standardOption = 'auto') {
    const optionen = [standardOption];
    if (trans.Source === trans.Target) {
        // loop above ergibt eine kleiner Schleife, ähnlich wie loop left etc.
        // So sind alle Schleifen einheitlich groß.
        optionen.push('loop above');
    }
    if ((trans.x !== 0 || trans.y !== 0) && !optionen.includes('loop above')) {
        optionen.push('bend left');
    }
    return optionen;
}
function formatiereOptionen(optionen) {
    if (optionen.length > 0) {
        return '[' + optionen.join(',') + ']';
    }
    return '';
}
function formatiereKellerZeichen(zeichen) {
    if (zeichen === '')
        return 'EPSILON';
    if (zeichen === '#')
        return 'KELLERBODEN';
    return zeichen;
}
function formatiereKellerÜbergang(trans, states) {
    const source = states[trans.Source];
    const target = states[trans.Target];
    const übergänge = [];
    for (const label of trans.Labels) {
        const übergang = [];
        übergang.push(formatiereKellerZeichen(label[1]));
        übergang.push(formatiereKellerZeichen(label[0]));
        let kellerAktion = label[2]
            .map(value => {
            return formatiereKellerZeichen(value);
        })
            .join(' ');
        if (kellerAktion === '')
            kellerAktion = 'EPSILON';
        übergang.push(kellerAktion);
        übergänge.push('    ' + übergang.join(', '));
    }
    const optionen = bestimmeÜbergangsOptionen(trans, 'above');
    const übergängeFormatiert = übergänge.join(';\n') + ';';
    return `  \\bKellerKante${formatiereOptionen(optionen)}{${source}}{${target}}{\n${übergängeFormatiert}\n  }\n`;
}
function formatiereTuringZeichen(zeichen) {
    if (zeichen === '☐')
        return 'LEER';
    return zeichen;
}
function formatiereTuringÜbergang(trans, states) {
    const source = states[trans.Source];
    const target = states[trans.Target];
    const übergänge = [];
    for (const label of trans.Labels) {
        const übergang = [];
        übergang.push(formatiereTuringZeichen(label[0]));
        übergang.push(formatiereTuringZeichen(label[1]));
        übergang.push(formatiereTuringZeichen(label[2]));
        übergänge.push('    ' + übergang.join(', '));
    }
    const optionen = bestimmeÜbergangsOptionen(trans, 'above');
    const übergängeFormatiert = übergänge.join(';\n') + ';';
    return `  \\bTuringKante${formatiereOptionen(optionen)}{${source}}{${target}}{\n${übergängeFormatiert}\n  }\n`;
}
function formatiereFlaciLink(def) {
    return `\\bFlaci{A${def.GUID}}`;
}
function formatiereTexEnv(name, inhalt, optionen = null) {
    let opt = '';
    if (optionen != null) {
        opt = '[' + optionen + ']';
    }
    return '\\begin{' + name + '}' + opt + '\n' + inhalt + '\n\\end{' + name + '}';
}
function formatiereAutomat(def) {
    const statesRendered = [];
    let automatenTyp;
    if (def.type === 'NKA' || def.type === 'DKA') {
        automatenTyp = 'keller';
    }
    else if (def.type === 'TM') {
        automatenTyp = 'turing';
    }
    else {
        automatenTyp = 'endlicher';
    }
    const states = def.automaton.States;
    const stateNames = {};
    for (const state of states) {
        stateNames[state.ID] = state.Name;
        statesRendered.push(formatiereZustand(state));
    }
    const transitionsRendered = [];
    for (const state of states) {
        for (const transition of state.Transitions) {
            if (automatenTyp === 'endlicher') {
                transitionsRendered.push(formatiereÜbergang(transition, stateNames));
            }
            else if (automatenTyp === 'keller') {
                const trans = transition;
                transitionsRendered.push(formatiereKellerÜbergang(trans, stateNames));
            }
            else {
                const trans = transition;
                transitionsRendered.push(formatiereTuringÜbergang(trans, stateNames));
            }
        }
    }
    let envOption;
    if (automatenTyp === 'endlicher') {
        envOption = 'li automat';
    }
    else if (automatenTyp === 'keller') {
        envOption = 'li kellerautomat';
    }
    else {
        envOption = 'li turingmaschine';
    }
    const inhalt = statesRendered.join('\n') +
        '\n\n' +
        transitionsRendered.join('\n').replace(/\n$/, '');
    const tikzPicture = formatiereTexEnv('center', formatiereTexEnv('tikzpicture', inhalt, envOption));
    const bAntwort = tikzPicture + '\n' + formatiereFlaciLink(def);
    return formatiereTexEnv('bAntwort', bAntwort);
}
export default function (jsonDateiPfad) {
    if (jsonDateiPfad.match(/^\//) == null) {
        jsonDateiPfad = path.join(process.cwd(), jsonDateiPfad);
    }
    // eslint-disable-next-line
    const definition = require(jsonDateiPfad);
    console.log(formatiereAutomat(definition));
}
//# sourceMappingURL=flaci.js.map
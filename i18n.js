// Textes dynamiques / Dynamic strings. La langue vient de <html lang="...">.
const I18N = {
  fr: {
    dec: ',',
    color: (n) => `Couleur du type ${n}`,
    target: 'cible',
    particle: 'particule',
    pulls: (i, j) => `Le type ${i} est attiré par le type ${j}`,
    pushes: (i, j) => `Le type ${i} repousse le type ${j}`,
    pause: 'Pause',
    resume: 'Reprendre',
    stats: (n, fps) => `${n} particules · ${fps} i/s`,
  },
  en: {
    dec: '.',
    color: (n) => `Color of type ${n}`,
    target: 'target',
    particle: 'particle',
    pulls: (i, j) => `Type ${i} is attracted to type ${j}`,
    pushes: (i, j) => `Type ${i} repels type ${j}`,
    pause: 'Pause',
    resume: 'Resume',
    stats: (n, fps) => `${n} particles · ${fps} fps`,
  },
};
const T = I18N[document.documentElement.lang] || I18N.fr;
const num = (v, d) => v.toFixed(d).replace('.', T.dec);

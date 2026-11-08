import { initGuess, initNav, initPicker, initSim } from './widgets.js';
import { initBrief } from './brief.js';
import { initSkill } from './skill.js';
import { initTools } from './tools.js';
import { initPack } from './pack.js';
import { initHero } from './hero.js';
import { initCurve, initDelegation, initLadder } from './explainers.js';
import { initSpend } from './spend.js';
import { initCycle } from './motion.js';

// На странице только её виджеты, а init без своего корня падает на первом обращении к DOM
const WIDGET_INITS = [
  ['fig-context', initSim],
  ['fig-brief', initBrief],
  ['fig-skill', initSkill],
  ['fig-tools', initTools],
  ['fig-pack', initPack],
  ['fig-guess', initGuess],
  ['fig-picker', initPicker],
  ['fig-ladder', initLadder],
  ['fig-cycle', initCycle],
  ['fig-delegation', initDelegation],
  ['fig-curve', initCurve],
  ['fig-spend', initSpend],
  ['scene', initHero],
];

initNav();
for (const [rootId, init] of WIDGET_INITS) {
  if (document.getElementById(rootId)) init();
}

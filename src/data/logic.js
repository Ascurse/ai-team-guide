// Логика, которая читает тексты: одна на оба языка, модули src/data и src/data/en привязывают её к своим строкам
export const briefPromptFor = (base, parts) => (on) => [base, ...parts.filter((part) => on[part.id]).map((part) => part.text)].join(' ');

const TEMPLATE_SLOT = /<[^>]+>/;
const SKILL_PART_TEXT = {
  name: (routine) => `---\nname: ${routine.name}`,
  description: (routine) => `description: ${routine.description}\n---`,
  steps: (routine, heading) => `## ${heading}\n${routine.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`,
  limits: (routine, heading) => `## ${heading}\n${routine.limits}`,
};

export function skillLogic(template, parts) {
  const [start, middle, end] = template.split(TEMPLATE_SLOT);
  // Строки запроса с отмеченными местами, куда подставлена рутина
  const skillPromptParts = (routine) => [
    { text: start },
    { text: routine.task, filled: true },
    { text: middle },
    { text: routine.sample, filled: true },
    { text: end },
  ];
  return {
    skillPromptParts,
    skillPrompt: (routine) => skillPromptParts(routine).map((part) => part.text).join(''),
    skillFile: (routine) => parts.map((part) => ({ ...part, text: SKILL_PART_TEXT[part.id](routine, part.label) })),
  };
}

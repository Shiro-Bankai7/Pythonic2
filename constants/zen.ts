export interface ZenOfDay {
  line: string;
  keyword: string;
}

const ZEN_LINES = [
  'Beautiful is better than ugly.',
  'Explicit is better than implicit.',
  'Simple is better than complex.',
  'Complex is better than complicated.',
  'Flat is better than nested.',
  'Sparse is better than dense.',
  'Readability counts.',
  "Special cases aren't special enough to break the rules.",
  'Although practicality beats purity.',
  'Errors should never pass silently.',
  'Unless explicitly silenced.',
  'In the face of ambiguity, refuse the temptation to guess.',
  'There should be one-- and preferably only one --obvious way to do it.',
  "Although that way may not be obvious at first unless you're Dutch.",
  'Now is better than never.',
  'Although never is often better than right now.',
  "If the implementation is hard to explain, it's a bad idea.",
  "If the implementation is easy to explain, it may be a good idea.",
  "Namespaces are one honking great idea -- let's do more of those!",
];

const ZEN_KEYWORDS = [
  'clarity',
  'simplicity',
  'readability',
  'explicitness',
  'practicality',
  'consistency',
  'focus',
  'discipline',
  'patience',
  'craft',
];

const dayStamp = (date: Date): number =>
  Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);

export const getZenOfDay = (date: Date = new Date()): ZenOfDay => {
  const stamp = Math.abs(dayStamp(date));
  return {
    line: ZEN_LINES[stamp % ZEN_LINES.length],
    keyword: ZEN_KEYWORDS[(stamp * 7) % ZEN_KEYWORDS.length],
  };
};

import { guides } from './guides';
import { tutorials } from './tutorials';
import { articles } from './articles';

export const allContent = [
  ...guides.map(c => ({ ...c, type: 'guide' })),
  ...tutorials.map(c => ({ ...c, type: 'tutorial' })),
  ...articles.map(c => ({ ...c, type: 'article' })),
];

export const getContentById = (id: string) => allContent.find(c => c.id === id);
export const getContentByType = (type: string) => allContent.filter(c => c.type === type);

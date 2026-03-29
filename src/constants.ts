import chronicleData from './data/chronicle.json';

export interface ChronicleEvent {
  id: string;
  date: string;
  year: string;
  title: string;
  description: string;
  image?: string;
  category: 'milestone' | 'funny' | 'meeting' | 'legend';
  dogNames?: string[];
}

const data = chronicleData as { title: string; subtitle: string; events: ChronicleEvent[] };

export const CHRONICLE_TITLE = data.title;
export const CHRONICLE_SUBTITLE = data.subtitle;
export const CHRONICLE_EVENTS: ChronicleEvent[] = data.events;

export interface Chapter {
  roomId: string;
  clipUrl: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  chapters: Chapter[];
  progressPct?: number;
  exercises?: { completed: boolean }[];
}

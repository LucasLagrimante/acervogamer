export interface Game {
  id: number;
  title: string;
  aliases?: string[];
  platform: string;
  year: string;
  genre: string;
  currentlyPlaying?: boolean;
  cover: string;
  comment: string;
  youtubeId: string;
}

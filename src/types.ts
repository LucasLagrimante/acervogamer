export interface Game {
  id: number;
  title: string;
  aliases?: string[];
  platform: string;
  year: string;
  genre: string;
  rating: number;
  cover: string;
  comment: string;
  youtubeId: string;
}

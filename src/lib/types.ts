export type ModelCategory = 'trending' | 'popular' | 'new';

export interface Model {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  profileImage: string;
  coverImage?: string;
  category: ModelCategory;
  createdAt: string;
}

export type ContentType = 'video' | 'image';

export interface Content {
  id: string;
  modelId: string;
  type: ContentType;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  likesCount: number;
  isPremium: boolean;
  createdAt: string;
}

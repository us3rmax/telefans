import { Model, Content } from './types';
import { supabase } from './supabase';

export const MOCK_MODELS: Model[] = [
  {
    id: '1',
    username: 'abigaiil_morris',
    displayName: 'Abigaiil Morris',
    bio: 'Official Telefans profile. Subscribe for exclusive content.',
    profileImage: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/1ee6e615-cd85-4c86-2a35-cb9943d60900/public',
    category: 'trending',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'alex_mucci',
    displayName: 'Alex Mucci',
    bio: 'Digital creator and model.',
    profileImage: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/9884e5c0-b48f-497f-99e4-8b035fd99300/public',
    category: 'trending',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    username: 'emma_magnus',
    displayName: 'Emma Magnus',
    bio: 'Digital creator and model.',
    profileImage: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/9884e5c0-b48f-497f-99e4-8b035fd99300/public',
    category: 'trending',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    username: 'brandi_andrews',
    displayName: 'Brandi Andrews',
    bio: 'Official Telefans profile. Subscribe for exclusive content.',
    profileImage: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/1ee6e615-cd85-4c86-2a35-cb9943d60900/public',
    category: 'popular',
    createdAt: new Date().toISOString(),
  }
];

export const DataService = {
  getModels: async (): Promise<Model[]> => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) throw new Error('Supabase data not available');

      return data.map(m => ({
        id: m.id,
        username: m.username,
        displayName: m.display_name,
        bio: m.bio,
        profileImage: m.profile_image,
        coverImage: m.cover_image,
        category: m.category,
        createdAt: m.created_at
      }));
    } catch (e) {
      console.log('Usando Mock Data (Supabase não configurado)');
      return MOCK_MODELS;
    }
  },
  
  getModelByUsername: async (username: string): Promise<Model | undefined> => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) throw new Error('Model not found');

      return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        bio: data.bio,
        profileImage: data.profile_image,
        coverImage: data.cover_image,
        category: data.category,
        createdAt: data.created_at
      };
    } catch (e) {
      return MOCK_MODELS.find(m => m.username === username);
    }
  },

  getReels: async (): Promise<Content[]> => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'video')
        .order('created_at', { ascending: false });

      if (error || !data) throw new Error('Reels not found');

      return data.map(c => ({
        id: c.id,
        modelId: c.model_id,
        type: c.type as any,
        url: c.url,
        thumbnailUrl: c.thumbnail_url,
        caption: c.caption,
        likesCount: c.likes_count,
        isPremium: c.is_premium,
        createdAt: c.created_at
      }));
    } catch (e) {
      return [];
    }
  },

  // Sincroniza o usuário do Telegram com o banco de dados
  syncUserProfile: async (user: any) => {
    if (!user?.id) return;
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        photo_url: user.photoUrl
      });
    } catch (e) {
      console.error('Erro ao sincronizar perfil:', e);
    }
  }
};

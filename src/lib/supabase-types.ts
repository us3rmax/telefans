export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      admin_roles: {
        Row: { user_id: string; role: string; created_at: string }
        Insert: { user_id: string; role?: string; created_at?: string }
        Update: { user_id?: string; role?: string; created_at?: string }
        Relationships: []
      }
      creators: {
        Row: {
          id: string; slug: string; name: string; handle: string; status: string
          bio: string; expanded_bio: string | null; avatar_image: string; cover_image: string
          badges: Json; stats: Json; subscription: Json; tabs: Json; published: boolean
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; slug: string; name: string; handle: string; status?: string
          bio?: string; expanded_bio?: string | null; avatar_image?: string; cover_image?: string
          badges?: Json; stats?: Json; subscription?: Json; tabs?: Json; published?: boolean
          created_at?: string; updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['creators']['Insert']>
        Relationships: []
      }
      creator_posts: {
        Row: {
          id: string; creator_id: string; type: string; title: string; caption: string
          media_url: string; thumbnail_url: string | null; published: boolean; reels_enabled: boolean
          created_by: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; creator_id: string; type: string; title: string; caption?: string
          media_url: string; thumbnail_url?: string | null; published?: boolean; reels_enabled?: boolean
          created_by?: string | null; created_at?: string; updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['creator_posts']['Insert']>
        Relationships: []
      }
      post_likes: {
        Row: { post_id: string; user_id: string; visitor_key: string; created_at: string }
        Insert: { post_id: string; user_id?: string | null; visitor_key?: string | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['post_likes']['Insert']>
        Relationships: []
      }
      post_comments: {
        Row: { id: string; post_id: string; user_id: string | null; visitor_key: string | null; body: string; created_at: string }
        Insert: { id?: string; post_id: string; user_id?: string | null; visitor_key?: string | null; body: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['post_comments']['Insert']>
        Relationships: []
      }
      post_views: {
        Row: { id: string; post_id: string; user_id: string | null; visitor_key: string | null; created_at: string }
        Insert: { id?: string; post_id: string; user_id?: string | null; visitor_key?: string | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['post_views']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: { is_admin: { Args: never; Returns: boolean } }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

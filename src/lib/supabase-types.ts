export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_following: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          telegram_user_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          telegram_user_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          telegram_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_following_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_posts: {
        Row: {
          caption: string
          comments_enabled: boolean
          created_at: string
          is_paid: boolean
          created_by: string | null
          creator_id: string
          id: string
          media_url: string
          published: boolean
          published_at: string | null
          reels_enabled: boolean
          scheduled_at: string | null
          sort_order: number
          status: string
          thumbnail_url: string | null
          unlock_price: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          caption?: string
          comments_enabled?: boolean
          created_at?: string
          is_paid?: boolean
          created_by?: string | null
          creator_id: string
          id?: string
          media_url: string
          published?: boolean
          published_at?: string | null
          reels_enabled?: boolean
          scheduled_at?: string | null
          sort_order?: number
          status?: string
          thumbnail_url?: string | null
          unlock_price?: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          caption?: string
          comments_enabled?: boolean
          created_at?: string
          is_paid?: boolean
          created_by?: string | null
          creator_id?: string
          id?: string
          media_url?: string
          published?: boolean
          published_at?: string | null
          reels_enabled?: boolean
          scheduled_at?: string | null
          sort_order?: number
          status?: string
          thumbnail_url?: string | null
          unlock_price?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          avatar_image: string
          badges: Json
          bio: string
          cover_image: string
          created_at: string
          expanded_bio: string | null
          handle: string
          id: string
          name: string
          published: boolean
          slug: string
          stats: Json
          status: string
          subscription: Json
          tabs: Json
          updated_at: string
        }
        Insert: {
          avatar_image?: string
          badges?: Json
          bio?: string
          cover_image?: string
          created_at?: string
          expanded_bio?: string | null
          handle: string
          id?: string
          name: string
          published?: boolean
          slug: string
          stats?: Json
          status?: string
          subscription?: Json
          tabs?: Json
          updated_at?: string
        }
        Update: {
          avatar_image?: string
          badges?: Json
          bio?: string
          cover_image?: string
          created_at?: string
          expanded_bio?: string | null
          handle?: string
          id?: string
          name?: string
          published?: boolean
          slug?: string
          stats?: Json
          status?: string
          subscription?: Json
          tabs?: Json
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          byte_size: number | null
          created_at: string
          creator_id: string | null
          duration_seconds: number | null
          height: number | null
          id: string
          kind: string
          mime_type: string | null
          original_name: string | null
          public_url: string | null
          status: string
          storage_path: string
          thumbnail_url: string | null
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          byte_size?: number | null
          created_at?: string
          creator_id?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind: string
          mime_type?: string | null
          original_name?: string | null
          public_url?: string | null
          status?: string
          storage_path: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          byte_size?: number | null
          created_at?: string
          creator_id?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          original_name?: string | null
          public_url?: string | null
          status?: string
          storage_path?: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string | null
          visitor_key: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id?: string | null
          visitor_key?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string | null
          visitor_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          id: string
          created_at: string
          post_id: string
          user_id: string | null
          visitor_key: string
        }
        Insert: {
          id?: string
          created_at?: string
          post_id: string
          user_id?: string | null
          visitor_key: string
        }
        Update: {
          id?: string
          created_at?: string
          post_id?: string
          user_id?: string | null
          visitor_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string | null
          visitor_key: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id?: string | null
          visitor_key?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string | null
          visitor_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_users: {
        Row: {
          auth_date: string
          bio: string
          created_at: string
          date_of_birth: string | null
          first_name: string
          last_name: string | null
          photo_url: string | null
          telegram_id: number
          updated_at: string
          username: string | null
          gender: string
          profile_photo_url: string | null
        }
        Insert: {
          auth_date: string
          bio?: string
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          last_name?: string | null
          photo_url?: string | null
          telegram_id: number
          updated_at?: string
          username?: string | null
          gender?: string
          profile_photo_url?: string | null
        }
        Update: {
          auth_date?: string
          bio?: string
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          last_name?: string | null
          photo_url?: string | null
          telegram_id?: number
          updated_at?: string
          username?: string | null
          gender?: string
          profile_photo_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const


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
    PostgrestVersion: "14.17"
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
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json
          referred_telegram_id: number | null
          telegram_id: number
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json
          referred_telegram_id?: number | null
          telegram_id: number
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json
          referred_telegram_id?: number | null
          telegram_id?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_referred_telegram_id_fkey"
            columns: ["referred_telegram_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["telegram_id"]
          },
          {
            foreignKeyName: "coin_transactions_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["telegram_id"]
          },
        ]
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
          carousel_id: string | null
          carousel_index: number
          carousel_position: number
          carousel_total: number | null
          comments_enabled: boolean
          created_at: string
          created_by: string | null
          creator_id: string
          id: string
          is_paid: boolean
          media_url: string
          published: boolean
          published_at: string | null
          reels_enabled: boolean
          scheduled_at: string | null
          sort_order: number
          source_external_id: string | null
          source_site: string | null
          status: string
          thumbnail_url: string | null
          title: string
          type: string
          unlock_price: number
          updated_at: string
        }
        Insert: {
          caption?: string
          carousel_id?: string | null
          carousel_index?: number
          carousel_position?: number
          carousel_total?: number | null
          comments_enabled?: boolean
          created_at?: string
          created_by?: string | null
          creator_id: string
          id?: string
          is_paid?: boolean
          media_url: string
          published?: boolean
          published_at?: string | null
          reels_enabled?: boolean
          scheduled_at?: string | null
          sort_order?: number
          source_external_id?: string | null
          source_site?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          type: string
          unlock_price?: number
          updated_at?: string
        }
        Update: {
          caption?: string
          carousel_id?: string | null
          carousel_index?: number
          carousel_position?: number
          carousel_total?: number | null
          comments_enabled?: boolean
          created_at?: string
          created_by?: string | null
          creator_id?: string
          id?: string
          is_paid?: boolean
          media_url?: string
          published?: boolean
          published_at?: string | null
          reels_enabled?: boolean
          scheduled_at?: string | null
          sort_order?: number
          source_external_id?: string | null
          source_site?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          type?: string
          unlock_price?: number
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
      creator_subscription_settings: {
        Row: {
          created_at: string
          creator_id: string
          is_active: boolean
          message: string
          normal_price_stars: number
          plan_mode: string
          promo_days: number
          promo_expires_at: string | null
          promo_price_stars: number
          telegram_username: string
          title: string
          updated_at: string
          vip_channel_url: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          is_active?: boolean
          message?: string
          normal_price_stars?: number
          plan_mode?: string
          promo_days?: number
          promo_expires_at?: string | null
          promo_price_stars?: number
          telegram_username?: string
          title?: string
          updated_at?: string
          vip_channel_url?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          is_active?: boolean
          message?: string
          normal_price_stars?: number
          plan_mode?: string
          promo_days?: number
          promo_expires_at?: string | null
          promo_price_stars?: number
          telegram_username?: string
          title?: string
          updated_at?: string
          vip_channel_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_subscription_settings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          creator_id: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payment_status: string
          stars_amount: number
          subscription_type: string
          telegram_id: number
          telegram_invoice_payload: string | null
          telegram_payment_charge_id: string | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          creator_id: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_status?: string
          stars_amount?: number
          subscription_type: string
          telegram_id: number
          telegram_invoice_payload?: string | null
          telegram_payment_charge_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          creator_id?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_status?: string
          stars_amount?: number
          subscription_type?: string
          telegram_id?: number
          telegram_invoice_payload?: string | null
          telegram_payment_charge_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_subscriptions_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["telegram_id"]
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
          source_external_id: string | null
          source_profile_url: string | null
          source_site: string | null
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
          source_external_id?: string | null
          source_profile_url?: string | null
          source_site?: string | null
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
          source_external_id?: string | null
          source_profile_url?: string | null
          source_site?: string | null
          stats?: Json
          status?: string
          subscription?: Json
          tabs?: Json
          updated_at?: string
        }
        Relationships: []
      }
      crm_campaigns: {
        Row: {
          budget: number
          channel: string
          created_at: string
          creator_id: string | null
          ends_at: string | null
          id: string
          metadata: Json
          name: string
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number
          channel: string
          created_at?: string
          creator_id?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json
          name: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number
          channel?: string
          created_at?: string
          creator_id?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json
          name?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaigns_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_commission_rules: {
        Row: {
          active: boolean
          agency_percent: number
          created_at: string
          creator_id: string | null
          creator_percent: number
          id: string
          operating_cost_percent: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          agency_percent?: number
          created_at?: string
          creator_id?: string | null
          creator_percent?: number
          id?: string
          operating_cost_percent?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          agency_percent?: number
          created_at?: string
          creator_id?: string | null
          creator_percent?: number
          id?: string
          operating_cost_percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_commission_rules_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_fan_events: {
        Row: {
          amount: number | null
          created_at: string
          creator_id: string | null
          currency: string
          event_type: string
          id: string
          idempotency_key: string | null
          metadata: Json
          occurred_at: string
          post_id: string | null
          telegram_id: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          creator_id?: string | null
          currency?: string
          event_type: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          occurred_at?: string
          post_id?: string | null
          telegram_id?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          creator_id?: string | null
          currency?: string
          event_type?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          occurred_at?: string
          post_id?: string | null
          telegram_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_fan_events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_fan_events_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_fan_events_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      crm_fan_transactions: {
        Row: {
          agency_amount: number
          created_at: string
          creator_amount: number
          creator_id: string | null
          currency: string
          external_reference: string | null
          gross_amount: number
          id: string
          idempotency_key: string | null
          metadata: Json
          occurred_at: string
          operating_cost: number
          post_id: string | null
          telegram_id: number | null
          transaction_type: string
        }
        Insert: {
          agency_amount?: number
          created_at?: string
          creator_amount?: number
          creator_id?: string | null
          currency?: string
          external_reference?: string | null
          gross_amount: number
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          occurred_at?: string
          operating_cost?: number
          post_id?: string | null
          telegram_id?: number | null
          transaction_type: string
        }
        Update: {
          agency_amount?: number
          created_at?: string
          creator_amount?: number
          creator_id?: string | null
          currency?: string
          external_reference?: string | null
          gross_amount?: number
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          occurred_at?: string
          operating_cost?: number
          post_id?: string | null
          telegram_id?: number | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_fan_transactions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_fan_transactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_fan_transactions_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      crm_media_events: {
        Row: {
          campaign_id: string | null
          creator_id: string | null
          event_type: string
          id: string
          media_asset_id: string | null
          metadata: Json
          occurred_at: string
          telegram_id: number | null
        }
        Insert: {
          campaign_id?: string | null
          creator_id?: string | null
          event_type: string
          id?: string
          media_asset_id?: string | null
          metadata?: Json
          occurred_at?: string
          telegram_id?: number | null
        }
        Update: {
          campaign_id?: string | null
          creator_id?: string | null
          event_type?: string
          id?: string
          media_asset_id?: string | null
          metadata?: Json
          occurred_at?: string
          telegram_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_media_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_media_events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_media_events_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_media_events_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      crm_media_tags: {
        Row: {
          created_at: string
          media_asset_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          media_asset_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          media_asset_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_media_tags_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_media_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_vault_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_scheduled_content: {
        Row: {
          content_type: string
          created_at: string
          creator_id: string
          id: string
          payload: Json
          post_id: string | null
          published_at: string | null
          scheduled_for: string
          status: string
          updated_at: string
        }
        Insert: {
          content_type: string
          created_at?: string
          creator_id: string
          id?: string
          payload?: Json
          post_id?: string | null
          published_at?: string | null
          scheduled_for: string
          status?: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          creator_id?: string
          id?: string
          payload?: Json
          post_id?: string | null
          published_at?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_scheduled_content_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_scheduled_content_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tracking_links: {
        Row: {
          campaign_id: string | null
          clicks: number
          code: string
          conversions: number
          created_at: string
          creator_id: string | null
          destination_path: string
          id: string
          metadata: Json
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number
          code: string
          conversions?: number
          created_at?: string
          creator_id?: string | null
          destination_path: string
          id?: string
          metadata?: Json
        }
        Update: {
          campaign_id?: string | null
          clicks?: number
          code?: string
          conversions?: number
          created_at?: string
          creator_id?: string | null
          destination_path?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "crm_tracking_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tracking_links_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_vault_tags: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
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
          source_external_id: string | null
          source_site: string | null
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
          source_external_id?: string | null
          source_site?: string | null
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
          source_external_id?: string | null
          source_site?: string | null
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
      media_unlocks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          price_paid: number
          telegram_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          price_paid: number
          telegram_id: number
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          price_paid?: number
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_unlocks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_unlocks_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      onlyfans_profiles: {
        Row: {
          bio: string | null
          cover_pic_file: string | null
          cover_pic_url: string | null
          id: number
          import_batch_id: string | null
          is_active: boolean | null
          last_updated: string | null
          name: string | null
          onlyfans_url: string | null
          profile_pic_file: string | null
          profile_pic_url: string | null
          source_external_id: string | null
          source_url: string | null
          username: string | null
        }
        Insert: {
          bio?: string | null
          cover_pic_file?: string | null
          cover_pic_url?: string | null
          id?: number
          import_batch_id?: string | null
          is_active?: boolean | null
          last_updated?: string | null
          name?: string | null
          onlyfans_url?: string | null
          profile_pic_file?: string | null
          profile_pic_url?: string | null
          source_external_id?: string | null
          source_url?: string | null
          username?: string | null
        }
        Update: {
          bio?: string | null
          cover_pic_file?: string | null
          cover_pic_url?: string | null
          id?: number
          import_batch_id?: string | null
          is_active?: boolean | null
          last_updated?: string | null
          name?: string | null
          onlyfans_url?: string | null
          profile_pic_file?: string | null
          profile_pic_url?: string | null
          source_external_id?: string | null
          source_url?: string | null
          username?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          telegram_id: number | null
          user_id: string | null
          visitor_key: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          telegram_id?: number | null
          user_id?: string | null
          visitor_key?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          telegram_id?: number | null
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
          created_at: string
          id: string
          post_id: string
          telegram_id: number | null
          user_id: string | null
          visitor_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          telegram_id?: number | null
          user_id?: string | null
          visitor_key: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          telegram_id?: number | null
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
          telegram_id: number | null
          user_id: string | null
          visitor_key: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          telegram_id?: number | null
          user_id?: string | null
          visitor_key?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          telegram_id?: number | null
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
          coins_balance: number
          created_at: string
          date_of_birth: string | null
          first_name: string
          gender: string
          last_name: string | null
          photo_url: string | null
          profile_photo_url: string | null
          referral_count: number
          referred_by: number | null
          telegram_id: number
          updated_at: string
          username: string | null
        }
        Insert: {
          auth_date: string
          bio?: string
          coins_balance?: number
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          gender?: string
          last_name?: string | null
          photo_url?: string | null
          profile_photo_url?: string | null
          referral_count?: number
          referred_by?: number | null
          telegram_id: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          auth_date?: string
          bio?: string
          coins_balance?: number
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          gender?: string
          last_name?: string | null
          photo_url?: string | null
          profile_photo_url?: string | null
          referral_count?: number
          referred_by?: number | null
          telegram_id?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_referral_reward: {
        Args: { p_referred_telegram_id: number; p_referrer_telegram_id: number }
        Returns: boolean
      }
      create_creator_carousel: {
        Args: { p_creator_id: string; p_post_ids: string[] }
        Returns: {
          caption: string
          carousel_id: string | null
          carousel_index: number
          carousel_position: number
          carousel_total: number | null
          comments_enabled: boolean
          created_at: string
          created_by: string | null
          creator_id: string
          id: string
          is_paid: boolean
          media_url: string
          published: boolean
          published_at: string | null
          reels_enabled: boolean
          scheduled_at: string | null
          sort_order: number
          source_external_id: string | null
          source_site: string | null
          status: string
          thumbnail_url: string | null
          title: string
          type: string
          unlock_price: number
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "creator_posts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      ingest_telescope_creators: { Args: { p_payload: Json }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_paid_media_unlocked: {
        Args: { p_post_id: string; p_telegram_id: number }
        Returns: boolean
      }
      purchase_paid_media: {
        Args: { p_post_id: string; p_telegram_id: number }
        Returns: Json
      }
      unlock_paid_media: {
        Args: { p_post_id: string; p_telegram_id: number }
        Returns: {
          already_unlocked: boolean
          media_url: string
          remaining_coins: number
        }[]
      }
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

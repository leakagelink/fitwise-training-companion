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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          reason: string
          record_id: string | null
          resource: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          record_id?: string | null
          resource: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          record_id?: string | null
          resource?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          content: string
          created_at: string
          for_date: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          for_date?: string
          id?: string
          kind?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          for_date?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      app_controls: {
        Row: {
          announcement: string
          coach_enabled: boolean
          diet_enabled: boolean
          id: number
          updated_at: string
          workouts_enabled: boolean
        }
        Insert: {
          announcement?: string
          coach_enabled?: boolean
          diet_enabled?: boolean
          id?: number
          updated_at?: string
          workouts_enabled?: boolean
        }
        Update: {
          announcement?: string
          coach_enabled?: boolean
          diet_enabled?: boolean
          id?: number
          updated_at?: string
          workouts_enabled?: boolean
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          arm_cm: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          created_at: string
          hips_cm: number | null
          id: string
          measured_on: string
          user_id: string
          waist_cm: number | null
        }
        Insert: {
          arm_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          measured_on?: string
          user_id: string
          waist_cm?: number | null
        }
        Update: {
          arm_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          measured_on?: string
          user_id?: string
          waist_cm?: number | null
        }
        Relationships: []
      }
      coach_bookings: {
        Row: {
          contact: string
          created_at: string
          id: string
          kind: string
          notes: string
          slot_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          contact: string
          created_at?: string
          id?: string
          kind: string
          notes?: string
          slot_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          contact?: string
          created_at?: string
          id?: string
          kind?: string
          notes?: string
          slot_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "coach_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_thread_id_user_id_fkey"
            columns: ["thread_id", "user_id"]
            isOneToOne: false
            referencedRelation: "coach_threads"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          bio: string
          experience_years: number
          is_active: boolean
          name: string
          photo_url: string
          specialization: string
          user_id: string
        }
        Insert: {
          bio?: string
          experience_years?: number
          is_active?: boolean
          name: string
          photo_url?: string
          specialization?: string
          user_id: string
        }
        Update: {
          bio?: string
          experience_years?: number
          is_active?: boolean
          name?: string
          photo_url?: string
          specialization?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_slots: {
        Row: {
          coach_name: string
          coach_user_id: string
          duration_min: number
          id: string
          is_available: boolean
          kind: string
          starts_at: string
        }
        Insert: {
          coach_name: string
          coach_user_id: string
          duration_min?: number
          id?: string
          is_available?: boolean
          kind: string
          starts_at: string
        }
        Update: {
          coach_name?: string
          coach_user_id?: string
          duration_min?: number
          id?: string
          is_available?: boolean
          kind?: string
          starts_at?: string
        }
        Relationships: []
      }
      coach_threads: {
        Row: {
          created_at: string
          generation_id: string | null
          generation_started_at: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generation_id?: string | null
          generation_started_at?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generation_id?: string | null
          generation_started_at?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          created_at: string
          date: string
          diet_followed: boolean
          energy_level: number | null
          id: string
          sleep_hours: number | null
          updated_at: string
          user_id: string
          water_ml: number
          workout_done: boolean
        }
        Insert: {
          created_at?: string
          date?: string
          diet_followed?: boolean
          energy_level?: number | null
          id?: string
          sleep_hours?: number | null
          updated_at?: string
          user_id: string
          water_ml?: number
          workout_done?: boolean
        }
        Update: {
          created_at?: string
          date?: string
          diet_followed?: boolean
          energy_level?: number | null
          id?: string
          sleep_hours?: number | null
          updated_at?: string
          user_id?: string
          water_ml?: number
          workout_done?: boolean
        }
        Relationships: []
      }
      generation_events: {
        Row: {
          cost_usd: number | null
          created_at: string
          id: string
          input_tokens: number | null
          latency_ms: number
          model: string
          operation: string
          output_tokens: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          latency_ms: number
          model: string
          operation: string
          output_tokens?: number | null
          status: string
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number
          model?: string
          operation?: string
          output_tokens?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_items: {
        Row: {
          category: string
          created_at: string
          id: string
          ingredient: string
          per_meal: string
          period_days: number
          plan_id: string | null
          purchased: boolean
          quantity: number
          unit: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          ingredient: string
          per_meal?: string
          period_days?: number
          plan_id?: string | null
          purchased?: boolean
          quantity?: number
          unit?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          ingredient?: string
          per_meal?: string
          period_days?: number
          plan_id?: string | null
          purchased?: boolean
          quantity?: number
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_followups: {
        Row: {
          created_at: string
          date: string
          id: string
          meal_type: string
          reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          meal_type: string
          reason?: string | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          meal_type?: string
          reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_followups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          created_at: string
          id: string
          logged_on: string
          meal_key: string | null
          meal_type: string
          name: string
          nutrition: Json
          servings: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logged_on: string
          meal_key?: string | null
          meal_type: string
          name: string
          nutrition: Json
          servings?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logged_on?: string
          meal_key?: string | null
          meal_type?: string
          name?: string
          nutrition?: Json
          servings?: number
          user_id?: string
        }
        Relationships: []
      }
      membership_access: {
        Row: {
          coach_access: boolean
          created_at: string
          diet_days: number
          ends_at: string
          granted_by: string | null
          id: string
          plan_id: string | null
          plan_name: string
          reason: string
          revoked_at: string | null
          source: string
          starts_at: string
          user_id: string | null
          workout_access: boolean
        }
        Insert: {
          coach_access: boolean
          created_at?: string
          diet_days: number
          ends_at: string
          granted_by?: string | null
          id?: string
          plan_id?: string | null
          plan_name: string
          reason: string
          revoked_at?: string | null
          source?: string
          starts_at?: string
          user_id?: string | null
          workout_access: boolean
        }
        Update: {
          coach_access?: boolean
          created_at?: string
          diet_days?: number
          ends_at?: string
          granted_by?: string | null
          id?: string
          plan_id?: string | null
          plan_name?: string
          reason?: string
          revoked_at?: string | null
          source?: string
          starts_at?: string
          user_id?: string | null
          workout_access?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "membership_access_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          coach_access: boolean
          created_at: string
          currency: string
          description: string
          diet_days: number
          duration_days: number
          id: string
          is_active: boolean
          name: string
          price_minor: number
          workout_access: boolean
        }
        Insert: {
          coach_access?: boolean
          created_at?: string
          currency?: string
          description?: string
          diet_days?: number
          duration_days?: number
          id?: string
          is_active?: boolean
          name: string
          price_minor?: number
          workout_access?: boolean
        }
        Update: {
          coach_access?: boolean
          created_at?: string
          currency?: string
          description?: string
          diet_days?: number
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          price_minor?: number
          workout_access?: boolean
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          announcements: boolean
          expiry_reminders: boolean
          user_id: string
        }
        Insert: {
          announcements?: boolean
          expiry_reminders?: boolean
          user_id: string
        }
        Update: {
          announcements?: boolean
          expiry_reminders?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          created_at: string
          days: Json
          duration_days: number
          id: string
          is_active: boolean
          name: string
          preferences: string
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days?: Json
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          preferences?: string
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          days?: Json
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          preferences?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          expires_at: string
          last_sent_at: string
          phone: string
          window_count: number
          window_start: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          expires_at: string
          last_sent_at?: string
          phone: string
          window_count?: number
          window_start?: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          expires_at?: string
          last_sent_at?: string
          phone?: string
          window_count?: number
          window_start?: string
        }
        Relationships: []
      }
      privacy_requests: {
        Row: {
          created_at: string
          id: string
          kind: string
          reason: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "privacy_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      private_data_access: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          reason: string
          resource: string
          target_user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          reason: string
          resource: string
          target_user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          resource?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_data_access_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_data_access_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[]
          created_at: string
          diet_type: string | null
          equipment: string[]
          experience_level: string | null
          food_preferences: string | null
          full_name: string | null
          gender: string | null
          goal: string | null
          health_consent_at: string | null
          height_cm: number | null
          id: string
          medical_conditions: string | null
          onboarded_at: string | null
          target_weight_kg: number | null
          trial_started_at: string
          updated_at: string
          weight_kg: number | null
          workout_duration_min: number | null
          workout_frequency: number | null
          workout_location: string | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[]
          created_at?: string
          diet_type?: string | null
          equipment?: string[]
          experience_level?: string | null
          food_preferences?: string | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          health_consent_at?: string | null
          height_cm?: number | null
          id: string
          medical_conditions?: string | null
          onboarded_at?: string | null
          target_weight_kg?: number | null
          trial_started_at?: string
          updated_at?: string
          weight_kg?: number | null
          workout_duration_min?: number | null
          workout_frequency?: number | null
          workout_location?: string | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[]
          created_at?: string
          diet_type?: string | null
          equipment?: string[]
          experience_level?: string | null
          food_preferences?: string | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          health_consent_at?: string | null
          height_cm?: number | null
          id?: string
          medical_conditions?: string | null
          onboarded_at?: string | null
          target_weight_kg?: number | null
          trial_started_at?: string
          updated_at?: string
          weight_kg?: number | null
          workout_duration_min?: number | null
          workout_frequency?: number | null
          workout_location?: string | null
        }
        Relationships: []
      }
      purchase_history: {
        Row: {
          amount_minor: number
          currency: string
          id: string
          plan_name: string
          provider: string
          provider_reference: string
          purchased_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount_minor: number
          currency: string
          id?: string
          plan_name: string
          provider: string
          provider_reference: string
          purchased_at?: string
          status: string
          user_id?: string | null
        }
        Update: {
          amount_minor?: number
          currency?: string
          id?: string
          plan_name?: string
          provider?: string
          provider_reference?: string
          purchased_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          breakfast_at: string
          breakfast_on: boolean
          dinner_at: string
          dinner_on: boolean
          lunch_at: string
          lunch_on: boolean
          missed_meal_followup: boolean
          updated_at: string
          user_id: string
          water_end: string
          water_every_hours: number
          water_on: boolean
          water_start: string
          workout_at: string
          workout_on: boolean
        }
        Insert: {
          breakfast_at?: string
          breakfast_on?: boolean
          dinner_at?: string
          dinner_on?: boolean
          lunch_at?: string
          lunch_on?: boolean
          missed_meal_followup?: boolean
          updated_at?: string
          user_id: string
          water_end?: string
          water_every_hours?: number
          water_on?: boolean
          water_start?: string
          workout_at?: string
          workout_on?: boolean
        }
        Update: {
          breakfast_at?: string
          breakfast_on?: boolean
          dinner_at?: string
          dinner_on?: boolean
          lunch_at?: string
          lunch_on?: boolean
          missed_meal_followup?: boolean
          updated_at?: string
          user_id?: string
          water_end?: string
          water_every_hours?: number
          water_on?: boolean
          water_start?: string
          workout_at?: string
          workout_on?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reminder_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_permissions: {
        Row: {
          capability: string
          created_at: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          capability: string
          created_at?: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          capability?: string
          created_at?: string
          granted_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_replies: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          from_staff: boolean
          id: string
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          from_staff?: boolean
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          from_staff?: boolean
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          body: string
          created_at: string
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          exercise_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          body: string
          created_at: string
          dedupe_key: string | null
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          id: string
          logged_on: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          logged_on?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          logged_on?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workout_day_exercises: {
        Row: {
          day_id: string
          exercise_id: string
          id: string
          notes: string | null
          position: number
          reps: string
          rest_sec: number
          sets: number
          user_id: string
        }
        Insert: {
          day_id: string
          exercise_id: string
          id?: string
          notes?: string | null
          position: number
          reps?: string
          rest_sec?: number
          sets?: number
          user_id: string
        }
        Update: {
          day_id?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          reps?: string
          rest_sec?: number
          sets?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_day_exercises_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_days: {
        Row: {
          day_index: number
          focus: string | null
          id: string
          plan_id: string
          title: string
          user_id: string
        }
        Insert: {
          day_index: number
          focus?: string | null
          id?: string
          plan_id: string
          title: string
          user_id: string
        }
        Update: {
          day_index?: number
          focus?: string | null
          id?: string
          plan_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          day_id: string | null
          finished_at: string | null
          id: string
          started_at: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          day_id?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          day_id?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed: boolean
          exercise_id: string
          id: string
          reps: number | null
          session_id: string
          set_index: number
          skipped: boolean
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          completed?: boolean
          exercise_id: string
          id?: string
          reps?: number | null
          session_id: string
          set_index: number
          skipped?: boolean
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          completed?: boolean
          exercise_id?: string
          id?: string
          reps?: number | null
          session_id?: string
          set_index?: number
          skipped?: boolean
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_find_users: {
        Args: { _search: string }
        Returns: {
          id: string
        }[]
      }
      admin_membership: {
        Args: {
          _actor: string
          _ends: string
          _plan: string
          _reason: string
          _revoke?: string
          _user: string
        }
        Returns: string
      }
      admin_save_record: {
        Args: {
          _actor: string
          _data: Json
          _delete?: boolean
          _id: string
          _reason?: string
          _table: string
        }
        Returns: string
      }
      admin_set_role: {
        Args: {
          _actor: string
          _remove: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _user: string
        }
        Returns: undefined
      }
      admin_upsert_record: {
        Args: {
          _actor: string
          _data: Json
          _delete: boolean
          _id: string
          _reason: string
          _table: string
        }
        Returns: string
      }
      current_user_has_slot_booking: {
        Args: { _slot: string }
        Returns: boolean
      }
      find_user_by_phone: {
        Args: { _phone: string }
        Returns: {
          email: string
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_staff_permission: {
        Args: { _capability: string; _user: string }
        Returns: boolean
      }
      send_expiry_notifications: { Args: never; Returns: number }
      staff_operation: {
        Args: { _action: string; _actor: string; _payload: Json }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "coach" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "coach", "user"],
    },
  },
} as const

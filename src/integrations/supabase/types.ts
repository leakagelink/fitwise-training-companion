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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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

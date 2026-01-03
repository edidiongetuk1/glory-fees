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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_sessions: {
        Row: {
          created_at: string
          end_year: number
          id: string
          is_active: boolean
          name: string
          start_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_year: number
          id?: string
          is_active?: boolean
          name: string
          start_year: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_year?: number
          id?: string
          is_active?: boolean
          name?: string
          start_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fee_changes: {
        Row: {
          approved_by: string | null
          class: string
          created_at: string
          id: string
          new_intake_fee: number
          requested_by: string
          returning_fee: number
          status: string
          term_id: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          class: string
          created_at?: string
          id?: string
          new_intake_fee: number
          requested_by: string
          returning_fee: number
          status?: string
          term_id: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          class?: string
          created_at?: string
          id?: string
          new_intake_fee?: number
          requested_by?: string
          returning_fee?: number
          status?: string
          term_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_changes_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_approvals: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_id: string
          payment_method: string
          requested_by: string
          requested_by_email: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string
          student_id: string
          term_id: string
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_id: string
          payment_method: string
          requested_by: string
          requested_by_email?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          student_id: string
          term_id: string
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_id?: string
          payment_method?: string
          requested_by?: string
          requested_by_email?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          student_id?: string
          term_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_approvals_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_audit: {
        Row: {
          action: string
          created_at: string
          id: string
          new_amount: number | null
          new_method: string | null
          payment_id: string
          performed_by: string
          previous_amount: number | null
          previous_method: string | null
          reason: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_amount?: number | null
          new_method?: string | null
          payment_id: string
          performed_by: string
          previous_amount?: number | null
          previous_method?: string | null
          reason: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_amount?: number | null
          new_method?: string | null
          payment_id?: string
          performed_by?: string
          previous_amount?: number | null
          previous_method?: string | null
          reason?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_paid: number
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          is_voided: boolean
          notes: string | null
          payment_method: string
          received_by: string | null
          student_id: string
          term_id: string
          transaction_id: string
          user_id: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount_paid: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_voided?: boolean
          notes?: string | null
          payment_method: string
          received_by?: string | null
          student_id: string
          term_id: string
          transaction_id: string
          user_id: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount_paid?: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_voided?: boolean
          notes?: string | null
          payment_method?: string
          received_by?: string | null
          student_id?: string
          term_id?: string
          transaction_id?: string
          user_id?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_archives: {
        Row: {
          archive_reason: string | null
          archived_at: string
          archived_by: string
          class: string
          first_name: string
          id: string
          is_new_intake: boolean
          middle_name: string | null
          original_id: string
          reg_number: string
          section: string
          session_id: string | null
          surname: string
          year_of_entry: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string
          archived_by: string
          class: string
          first_name: string
          id?: string
          is_new_intake: boolean
          middle_name?: string | null
          original_id: string
          reg_number: string
          section: string
          session_id?: string | null
          surname: string
          year_of_entry: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string
          archived_by?: string
          class?: string
          first_name?: string
          id?: string
          is_new_intake?: boolean
          middle_name?: string | null
          original_id?: string
          reg_number?: string
          section?: string
          session_id?: string | null
          surname?: string
          year_of_entry?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          class: string
          created_at: string
          first_name: string
          id: string
          is_new_intake: boolean
          middle_name: string | null
          previous_class: string | null
          reg_number: string
          section: Database["public"]["Enums"]["section_type"]
          session_id: string | null
          surname: string
          updated_at: string
          user_id: string
          year_of_entry: string
        }
        Insert: {
          class: string
          created_at?: string
          first_name: string
          id?: string
          is_new_intake?: boolean
          middle_name?: string | null
          previous_class?: string | null
          reg_number: string
          section: Database["public"]["Enums"]["section_type"]
          session_id?: string | null
          surname: string
          updated_at?: string
          user_id: string
          year_of_entry: string
        }
        Update: {
          class?: string
          created_at?: string
          first_name?: string
          id?: string
          is_new_intake?: boolean
          middle_name?: string | null
          previous_class?: string | null
          reg_number?: string
          section?: Database["public"]["Enums"]["section_type"]
          session_id?: string | null
          surname?: string
          updated_at?: string
          user_id?: string
          year_of_entry?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          created_at: string
          fees: Json
          id: string
          is_active: boolean
          session_id: string
          term: Database["public"]["Enums"]["term_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fees?: Json
          id?: string
          is_active?: boolean
          session_id: string
          term: Database["public"]["Enums"]["term_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fees?: Json
          id?: string
          is_active?: boolean
          session_id?: string
          term?: Database["public"]["Enums"]["term_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "bursar" | "staff" | "bursary"
      section_type: "primary" | "secondary"
      term_type: "1st" | "2nd" | "3rd"
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
    Enums: {
      app_role: ["super_admin", "bursar", "staff", "bursary"],
      section_type: ["primary", "secondary"],
      term_type: ["1st", "2nd", "3rd"],
    },
  },
} as const

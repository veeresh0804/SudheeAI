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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      ai_rejection_reports: {
        Row: {
          application_id: string
          created_at: string
          id: string
          job_id: string
          reason: string
          roadmap: Json | null
          skill_gaps: string[] | null
          student_id: string
          target_score: number | null
          timeline_weeks: number | null
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          job_id: string
          reason: string
          roadmap?: Json | null
          skill_gaps?: string[] | null
          student_id: string
          target_score?: number | null
          timeline_weeks?: number | null
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          job_id?: string
          reason?: string
          roadmap?: Json | null
          skill_gaps?: string[] | null
          student_id?: string
          target_score?: number | null
          timeline_weeks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_rejection_reports_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_rejection_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          ai_summary: string | null
          created_at: string | null
          id: string
          job_id: string
          match_score: number | null
          matched_skills: string[] | null
          missing_skills: string[] | null
          recruiter_feedback: string | null
          status: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          match_score?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          recruiter_feedback?: string | null
          status?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          match_score?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          recruiter_feedback?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_dna_analyses: {
        Row: {
          abstraction_score: number | null
          analysis_json: Json | null
          architecture_score: number | null
          created_at: string
          id: string
          maturity_score: number | null
          patterns_detected: string[] | null
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          abstraction_score?: number | null
          analysis_json?: Json | null
          architecture_score?: number | null
          created_at?: string
          id?: string
          maturity_score?: number | null
          patterns_detected?: string[] | null
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          abstraction_score?: number | null
          analysis_json?: Json | null
          architecture_score?: number | null
          created_at?: string
          id?: string
          maturity_score?: number | null
          patterns_detected?: string[] | null
          status?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          flag_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      intelligence_scores: {
        Row: {
          application_id: string | null
          component_scores_json: Json | null
          composite_score: number | null
          created_at: string
          custom_weights: Json | null
          dna_score: number | null
          eligible: boolean | null
          explanation: string | null
          growth_score: number | null
          id: string
          job_id: string | null
          legacy_score: number | null
          overall_reasoning_score: number | null
          project_score: number | null
          skill_match_score: number | null
          student_id: string
          trust_score: number | null
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          component_scores_json?: Json | null
          composite_score?: number | null
          created_at?: string
          custom_weights?: Json | null
          dna_score?: number | null
          eligible?: boolean | null
          explanation?: string | null
          growth_score?: number | null
          id?: string
          job_id?: string | null
          legacy_score?: number | null
          overall_reasoning_score?: number | null
          project_score?: number | null
          skill_match_score?: number | null
          student_id: string
          trust_score?: number | null
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          component_scores_json?: Json | null
          composite_score?: number | null
          created_at?: string
          custom_weights?: Json | null
          dna_score?: number | null
          eligible?: boolean | null
          explanation?: string | null
          growth_score?: number | null
          id?: string
          job_id?: string | null
          legacy_score?: number | null
          overall_reasoning_score?: number | null
          project_score?: number | null
          skill_match_score?: number | null
          student_id?: string
          trust_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_scores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company_name: string
          created_at: string | null
          deadline: string | null
          description: string
          experience_required: string | null
          id: string
          job_type: string | null
          location: string | null
          preferred_skills: string[] | null
          recruiter_id: string
          required_skills: string[] | null
          role_type: string | null
          salary_range: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_name?: string
          created_at?: string | null
          deadline?: string | null
          description?: string
          experience_required?: string | null
          id?: string
          job_type?: string | null
          location?: string | null
          preferred_skills?: string[] | null
          recruiter_id: string
          required_skills?: string[] | null
          role_type?: string | null
          salary_range?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          deadline?: string | null
          description?: string
          experience_required?: string | null
          id?: string
          job_type?: string | null
          location?: string | null
          preferred_skills?: string[] | null
          recruiter_id?: string
          required_skills?: string[] | null
          role_type?: string | null
          salary_range?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch: string | null
          company_name: string | null
          company_website: string | null
          created_at: string | null
          degree: string | null
          designation: string | null
          email: string
          full_name: string
          graduation_year: number | null
          id: string
          institution: string | null
          phone: string | null
          profile_complete: boolean | null
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          branch?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string | null
          degree?: string | null
          designation?: string | null
          email?: string
          full_name?: string
          graduation_year?: number | null
          id?: string
          institution?: string | null
          phone?: string | null
          profile_complete?: boolean | null
          updated_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          branch?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string | null
          degree?: string | null
          designation?: string | null
          email?: string
          full_name?: string
          graduation_year?: number | null
          id?: string
          institution?: string | null
          phone?: string | null
          profile_complete?: boolean | null
          updated_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      recruiter_trust_scores: {
        Row: {
          anomaly_flags: Json | null
          created_at: string
          id: string
          last_computed_at: string | null
          recruiter_id: string
          trust_score: number | null
          updated_at: string
        }
        Insert: {
          anomaly_flags?: Json | null
          created_at?: string
          id?: string
          last_computed_at?: string | null
          recruiter_id: string
          trust_score?: number | null
          updated_at?: string
        }
        Update: {
          anomaly_flags?: Json | null
          created_at?: string
          id?: string
          last_computed_at?: string | null
          recruiter_id?: string
          trust_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      skill_progress_history: {
        Row: {
          id: string
          metadata: Json | null
          proficiency_score: number
          recorded_at: string
          skill_name: string
          source: string | null
          student_id: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          proficiency_score?: number
          recorded_at?: string
          skill_name: string
          source?: string | null
          student_id: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          proficiency_score?: number
          recorded_at?: string
          skill_name?: string
          source?: string | null
          student_id?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          ai_analysis: Json | null
          created_at: string | null
          extracted_skills: string[] | null
          github_data: Json | null
          github_url: string | null
          id: string
          last_analyzed_at: string | null
          leetcode_data: Json | null
          leetcode_url: string | null
          linkedin_data: Json | null
          linkedin_url: string | null
          profile_strength: number | null
          resume_data: Json | null
          resume_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string | null
          extracted_skills?: string[] | null
          github_data?: Json | null
          github_url?: string | null
          id?: string
          last_analyzed_at?: string | null
          leetcode_data?: Json | null
          leetcode_url?: string | null
          linkedin_data?: Json | null
          linkedin_url?: string | null
          profile_strength?: number | null
          resume_data?: Json | null
          resume_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string | null
          extracted_skills?: string[] | null
          github_data?: Json | null
          github_url?: string | null
          id?: string
          last_analyzed_at?: string | null
          leetcode_data?: Json | null
          leetcode_url?: string | null
          linkedin_data?: Json | null
          linkedin_url?: string | null
          profile_strength?: number | null
          resume_data?: Json | null
          resume_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_trust_scores: {
        Row: {
          anomaly_flags: Json | null
          created_at: string
          id: string
          last_computed_at: string | null
          student_id: string
          trust_score: number | null
          updated_at: string
          velocity_index: number | null
        }
        Insert: {
          anomaly_flags?: Json | null
          created_at?: string
          id?: string
          last_computed_at?: string | null
          student_id: string
          trust_score?: number | null
          updated_at?: string
          velocity_index?: number | null
        }
        Update: {
          anomaly_flags?: Json | null
          created_at?: string
          id?: string
          last_computed_at?: string | null
          student_id?: string
          trust_score?: number | null
          updated_at?: string
          velocity_index?: number | null
        }
        Relationships: []
      }
      talent_trajectory_predictions: {
        Row: {
          created_at: string
          forecast_12_month: Json | null
          forecast_6_month: Json | null
          id: string
          input_snapshot: Json | null
          probability: number | null
          projected_role: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          forecast_12_month?: Json | null
          forecast_6_month?: Json | null
          id?: string
          input_snapshot?: Json | null
          probability?: number | null
          projected_role?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          forecast_12_month?: Json | null
          forecast_6_month?: Json | null
          id?: string
          input_snapshot?: Json | null
          probability?: number | null
          projected_role?: string | null
          student_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          check_in_time: string | null
          created_at: string
          id: string
          is_manual: boolean
          meeting_id: string
          notes: string | null
          scanned_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          created_at?: string
          id?: string
          is_manual?: boolean
          meeting_id: string
          notes?: string | null
          scanned_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          created_at?: string
          id?: string
          is_manual?: boolean
          meeting_id?: string
          notes?: string | null
          scanned_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_logs: {
        Row: {
          changed_by_name: string
          created_at: string
          id: string
          meeting_id: string
          new_status: string
          prev_status: string
          reason: string
          user_id: string
        }
        Insert: {
          changed_by_name: string
          created_at?: string
          id?: string
          meeting_id: string
          new_status: string
          prev_status: string
          reason: string
          user_id: string
        }
        Update: {
          changed_by_name?: string
          created_at?: string
          id?: string
          meeting_id?: string
          new_status?: string
          prev_status?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flyers: {
        Row: {
          bg_url: string | null
          created_at: string
          description: string | null
          event_date: string | null
          event_time: string | null
          id: string
          location: string | null
          logo_url: string | null
          organizer: string | null
          qr_url: string | null
          subtitle: string | null
          tagline: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bg_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          organizer?: string | null
          qr_url?: string | null
          subtitle?: string | null
          tagline?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          bg_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          organizer?: string | null
          qr_url?: string | null
          subtitle?: string | null
          tagline?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          notes: string | null
          proof_url: string | null
          reason_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          notes?: string | null
          proof_url?: string | null
          reason_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          notes?: string | null
          proof_url?: string | null
          reason_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_counter: {
        Row: {
          last_number: number
          year: number
        }
        Insert: {
          last_number?: number
          year: number
        }
        Update: {
          last_number?: number
          year?: number
        }
        Relationships: []
      }
      letters: {
        Row: {
          alamat: string | null
          created_at: string
          extra_logo_url: string | null
          hari: string | null
          id: string
          instansi: string | null
          is_draft: boolean
          isi_surat: string | null
          jabatan: string | null
          jam: string | null
          kepada: string | null
          ketua_name: string | null
          lampiran: string | null
          letter_date: string
          letter_number: string
          letter_type: string
          number_int: number
          payload: Json | null
          penutup: string | null
          perihal: string
          qr_data: string | null
          sekretaris_name: string | null
          status: string
          tanggal_acara: string | null
          tempat: string | null
          ttd_ketua_url: string | null
          ttd_sekretaris_url: string | null
          updated_at: string
          verify_url: string | null
          year: number
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          extra_logo_url?: string | null
          hari?: string | null
          id?: string
          instansi?: string | null
          is_draft?: boolean
          isi_surat?: string | null
          jabatan?: string | null
          jam?: string | null
          kepada?: string | null
          ketua_name?: string | null
          lampiran?: string | null
          letter_date: string
          letter_number: string
          letter_type: string
          number_int: number
          payload?: Json | null
          penutup?: string | null
          perihal: string
          qr_data?: string | null
          sekretaris_name?: string | null
          status?: string
          tanggal_acara?: string | null
          tempat?: string | null
          ttd_ketua_url?: string | null
          ttd_sekretaris_url?: string | null
          updated_at?: string
          verify_url?: string | null
          year: number
        }
        Update: {
          alamat?: string | null
          created_at?: string
          extra_logo_url?: string | null
          hari?: string | null
          id?: string
          instansi?: string | null
          is_draft?: boolean
          isi_surat?: string | null
          jabatan?: string | null
          jam?: string | null
          kepada?: string | null
          ketua_name?: string | null
          lampiran?: string | null
          letter_date?: string
          letter_number?: string
          letter_type?: string
          number_int?: number
          payload?: Json | null
          penutup?: string | null
          perihal?: string
          qr_data?: string | null
          sekretaris_name?: string | null
          status?: string
          tanggal_acara?: string | null
          tempat?: string | null
          ttd_ketua_url?: string | null
          ttd_sekretaris_url?: string | null
          updated_at?: string
          verify_url?: string | null
          year?: number
        }
        Relationships: []
      }
      meeting_decisions: {
        Row: {
          created_at: string
          deadline: string | null
          decision_number: number
          id: string
          meeting_id: string
          pic_id: string | null
          pic_name: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          decision_number?: number
          id?: string
          meeting_id: string
          pic_id?: string | null
          pic_name?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          decision_number?: number
          id?: string
          meeting_id?: string
          pic_id?: string | null
          pic_name?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_decisions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_decisions_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          meeting_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string
          file_url: string
          id?: string
          meeting_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_files_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          conclusions: string | null
          created_at: string
          decisions_summary: string | null
          id: string
          meeting_id: string
          notes: string | null
          problems: string | null
          suggestions: string | null
          topics: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          conclusions?: string | null
          created_at?: string
          decisions_summary?: string | null
          id?: string
          meeting_id: string
          notes?: string | null
          problems?: string | null
          suggestions?: string | null
          topics?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          conclusions?: string | null
          created_at?: string
          decisions_summary?: string | null
          id?: string
          meeting_id?: string
          notes?: string | null
          problems?: string | null
          suggestions?: string | null
          topics?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          created_at: string
          id: string
          invitation_status: string
          meeting_id: string
          qr_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_status?: string
          meeting_id: string
          qr_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_status?: string
          meeting_id?: string
          qr_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_tasks: {
        Row: {
          created_at: string
          deadline: string | null
          id: string
          meeting_id: string
          notes: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          id?: string
          meeting_id: string
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          deadline?: string | null
          id?: string
          meeting_id?: string
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string | null
          attendance_close_at: string | null
          attendance_open_at: string | null
          category: string
          created_at: string
          created_by: string | null
          day_name: string | null
          description: string | null
          end_time: string | null
          id: string
          is_closed: boolean
          leader_name: string | null
          location: string | null
          meeting_date: string
          notulis_name: string | null
          on_time_until: string | null
          pic_name: string | null
          start_time: string
          status: string
          tagline: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          attendance_close_at?: string | null
          attendance_open_at?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          day_name?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_closed?: boolean
          leader_name?: string | null
          location?: string | null
          meeting_date: string
          notulis_name?: string | null
          on_time_until?: string | null
          pic_name?: string | null
          start_time: string
          status?: string
          tagline?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          attendance_close_at?: string | null
          attendance_open_at?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          day_name?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_closed?: boolean
          leader_name?: string | null
          location?: string | null
          meeting_date?: string
          notulis_name?: string | null
          on_time_until?: string | null
          pic_name?: string | null
          start_time?: string
          status?: string
          tagline?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          meeting_id: string | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          meeting_id?: string | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          meeting_id?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          ketua_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          sekretaris_name: string | null
          short_name: string
          ttd_ketua_url: string | null
          ttd_sekretaris_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ketua_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          sekretaris_name?: string | null
          short_name?: string
          ttd_ketua_url?: string | null
          ttd_sekretaris_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ketua_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          sekretaris_name?: string | null
          short_name?: string
          ttd_ketua_url?: string | null
          ttd_sekretaris_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bidang: string | null
          created_at: string
          divisi: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          joined_date: string | null
          kepanitiaan: string | null
          photo_url: string | null
          position: string | null
          role: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          bidang?: string | null
          created_at?: string
          divisi?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          joined_date?: string | null
          kepanitiaan?: string | null
          photo_url?: string | null
          position?: string | null
          role?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          bidang?: string | null
          created_at?: string
          divisi?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          joined_date?: string | null
          kepanitiaan?: string | null
          photo_url?: string | null
          position?: string | null
          role?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_letter_number: { Args: { p_year: number }; Returns: number }
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

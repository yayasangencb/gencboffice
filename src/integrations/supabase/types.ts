export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
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
          id: string
          full_name: string
          email: string
          whatsapp: string | null
          role: string
          position: string | null
          bidang: string | null
          divisi: string | null
          kepanitiaan: string | null
          photo_url: string | null
          is_active: boolean
          joined_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          whatsapp?: string | null
          role?: string
          position?: string | null
          bidang?: string | null
          divisi?: string | null
          kepanitiaan?: string | null
          photo_url?: string | null
          is_active?: boolean
          joined_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          whatsapp?: string | null
          role?: string
          position?: string | null
          bidang?: string | null
          divisi?: string | null
          kepanitiaan?: string | null
          photo_url?: string | null
          is_active?: boolean
          joined_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          id: string
          title: string
          category: string
          description: string | null
          agenda: string | null
          meeting_date: string
          day_name: string | null
          start_time: string
          end_time: string | null
          attendance_open_at: string | null
          on_time_until: string | null
          attendance_close_at: string | null
          location: string | null
          tagline: string | null
          leader_name: string | null
          pic_name: string | null
          notulis_name: string | null
          status: string
          is_closed: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          category?: string
          description?: string | null
          agenda?: string | null
          meeting_date: string
          day_name?: string | null
          start_time: string
          end_time?: string | null
          attendance_open_at?: string | null
          on_time_until?: string | null
          attendance_close_at?: string | null
          location?: string | null
          tagline?: string | null
          leader_name?: string | null
          pic_name?: string | null
          notulis_name?: string | null
          status?: string
          is_closed?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          category?: string
          description?: string | null
          agenda?: string | null
          meeting_date?: string
          day_name?: string | null
          start_time?: string
          end_time?: string | null
          attendance_open_at?: string | null
          on_time_until?: string | null
          attendance_close_at?: string | null
          location?: string | null
          tagline?: string | null
          leader_name?: string | null
          pic_name?: string | null
          notulis_name?: string | null
          status?: string
          is_closed?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_participants: {
        Row: {
          id: string
          meeting_id: string
          user_id: string
          qr_token: string
          invitation_status: string
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id: string
          qr_token: string
          invitation_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string
          qr_token?: string
          invitation_status?: string
          created_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          id: string
          meeting_id: string
          user_id: string
          status: string
          check_in_time: string | null
          scanned_by: string | null
          is_manual: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id: string
          status?: string
          check_in_time?: string | null
          scanned_by?: string | null
          is_manual?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string
          status?: string
          check_in_time?: string | null
          scanned_by?: string | null
          is_manual?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_logs: {
        Row: {
          id: string
          meeting_id: string
          user_id: string
          changed_by_name: string
          prev_status: string
          new_status: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id: string
          changed_by_name: string
          prev_status: string
          new_status: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string
          changed_by_name?: string
          prev_status?: string
          new_status?: string
          reason?: string
          created_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          id: string
          meeting_id: string
          user_id: string
          reason_type: string
          notes: string | null
          proof_url: string | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id: string
          reason_type: string
          notes?: string | null
          proof_url?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string
          reason_type?: string
          notes?: string | null
          proof_url?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      meeting_minutes: {
        Row: {
          id: string
          meeting_id: string
          topics: string | null
          problems: string | null
          suggestions: string | null
          decisions_summary: string | null
          conclusions: string | null
          notes: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          topics?: string | null
          problems?: string | null
          suggestions?: string | null
          decisions_summary?: string | null
          conclusions?: string | null
          notes?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          topics?: string | null
          problems?: string | null
          suggestions?: string | null
          decisions_summary?: string | null
          conclusions?: string | null
          notes?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_decisions: {
        Row: {
          id: string
          meeting_id: string
          decision_number: number
          title: string
          pic_id: string | null
          pic_name: string | null
          deadline: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          decision_number?: number
          title: string
          pic_id?: string | null
          pic_name?: string | null
          deadline?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          decision_number?: number
          title?: string
          pic_id?: string | null
          pic_name?: string | null
          deadline?: string | null
          status?: string | null
          created_at?: string
        }
        Relationships: []
      }
      meeting_tasks: {
        Row: {
          id: string
          meeting_id: string
          title: string
          user_id: string | null
          user_name: string | null
          deadline: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          title: string
          user_id?: string | null
          user_name?: string | null
          deadline?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          title?: string
          user_id?: string | null
          user_name?: string | null
          deadline?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_files: {
        Row: {
          id: string
          meeting_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          file_name: string
          file_url: string
          file_type?: string
          file_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          meeting_id: string | null
          title: string
          message: string
          type: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meeting_id?: string | null
          title: string
          message: string
          type?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meeting_id?: string | null
          title?: string
          message?: string
          type?: string | null
          is_read?: boolean
          created_at?: string
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

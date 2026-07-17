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
          penutup: string | null
          perihal: string
          sekretaris_name: string | null
          status: string
          tanggal_acara: string | null
          tempat: string | null
          ttd_ketua_url: string | null
          ttd_sekretaris_url: string | null
          updated_at: string
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
          penutup?: string | null
          perihal: string
          sekretaris_name?: string | null
          status?: string
          tanggal_acara?: string | null
          tempat?: string | null
          ttd_ketua_url?: string | null
          ttd_sekretaris_url?: string | null
          updated_at?: string
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
          penutup?: string | null
          perihal?: string
          sekretaris_name?: string | null
          status?: string
          tanggal_acara?: string | null
          tempat?: string | null
          ttd_ketua_url?: string | null
          ttd_sekretaris_url?: string | null
          updated_at?: string
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

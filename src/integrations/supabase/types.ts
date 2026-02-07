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
      flight_bookings: {
        Row: {
          adults: number | null
          airline: string | null
          arrival_date: string | null
          arrival_time: string | null
          booking_ref: string
          cabin_class: string | null
          children: number | null
          created_at: string
          departure_date: string
          departure_time: string | null
          duration: string | null
          flight_number: string | null
          from_city: string
          id: string
          pnr: string | null
          price_per_person: number | null
          return_date: string | null
          status: string
          stop_location: string | null
          stops: number | null
          to_city: string
          total_price: number | null
          trip_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adults?: number | null
          airline?: string | null
          arrival_date?: string | null
          arrival_time?: string | null
          booking_ref: string
          cabin_class?: string | null
          children?: number | null
          created_at?: string
          departure_date: string
          departure_time?: string | null
          duration?: string | null
          flight_number?: string | null
          from_city: string
          id?: string
          pnr?: string | null
          price_per_person?: number | null
          return_date?: string | null
          status?: string
          stop_location?: string | null
          stops?: number | null
          to_city: string
          total_price?: number | null
          trip_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adults?: number | null
          airline?: string | null
          arrival_date?: string | null
          arrival_time?: string | null
          booking_ref?: string
          cabin_class?: string | null
          children?: number | null
          created_at?: string
          departure_date?: string
          departure_time?: string | null
          duration?: string | null
          flight_number?: string | null
          from_city?: string
          id?: string
          pnr?: string | null
          price_per_person?: number | null
          return_date?: string | null
          status?: string
          stop_location?: string | null
          stops?: number | null
          to_city?: string
          total_price?: number | null
          trip_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      passengers: {
        Row: {
          booking_id: string
          id: string
          is_adult: boolean | null
          name: string
          passport_number: string | null
          ticket_number: string | null
        }
        Insert: {
          booking_id: string
          id?: string
          is_adult?: boolean | null
          name: string
          passport_number?: string | null
          ticket_number?: string | null
        }
        Update: {
          booking_id?: string
          id?: string
          is_adult?: boolean | null
          name?: string
          passport_number?: string | null
          ticket_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "flight_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          adults: number | null
          cargo_type: string | null
          children: number | null
          contents: string | null
          created_at: string
          departure_date: string | null
          email: string
          expires_at: string | null
          flight_class: string | null
          from_city: string | null
          id: string
          name: string
          phone: string
          quote_ref: string
          quoted_at: string | null
          quoted_price: number | null
          return_date: string | null
          route: string | null
          status: string
          to_city: string | null
          trip_type: string | null
          type: string
          user_id: string | null
          weight: number | null
        }
        Insert: {
          adults?: number | null
          cargo_type?: string | null
          children?: number | null
          contents?: string | null
          created_at?: string
          departure_date?: string | null
          email: string
          expires_at?: string | null
          flight_class?: string | null
          from_city?: string | null
          id?: string
          name: string
          phone: string
          quote_ref: string
          quoted_at?: string | null
          quoted_price?: number | null
          return_date?: string | null
          route?: string | null
          status?: string
          to_city?: string | null
          trip_type?: string | null
          type: string
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          adults?: number | null
          cargo_type?: string | null
          children?: number | null
          contents?: string | null
          created_at?: string
          departure_date?: string | null
          email?: string
          expires_at?: string | null
          flight_class?: string | null
          from_city?: string | null
          id?: string
          name?: string
          phone?: string
          quote_ref?: string
          quoted_at?: string | null
          quoted_price?: number | null
          return_date?: string | null
          route?: string | null
          status?: string
          to_city?: string | null
          trip_type?: string | null
          type?: string
          user_id?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      shipment_timeline: {
        Row: {
          description: string | null
          event_time: string
          id: string
          is_current: boolean | null
          location: string | null
          shipment_id: string
          status: string
        }
        Insert: {
          description?: string | null
          event_time?: string
          id?: string
          is_current?: boolean | null
          location?: string | null
          shipment_id: string
          status: string
        }
        Update: {
          description?: string | null
          event_time?: string
          id?: string
          is_current?: boolean | null
          location?: string | null
          shipment_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_timeline_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_delivery: string | null
          base_cost: number | null
          cargo_type: string | null
          contents: string | null
          created_at: string
          delivery_address: string | null
          estimated_delivery: string | null
          fragile_fee: number | null
          from_city: string | null
          has_insurance: boolean | null
          id: string
          insurance_cost: number | null
          is_fragile: boolean | null
          packages: number | null
          pickup_address: string | null
          receiver_name: string
          receiver_phone: string
          route: string
          sender_email: string | null
          sender_name: string
          sender_phone: string
          service_type: string | null
          status: string
          to_city: string | null
          total_cost: number | null
          tracking_id: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          actual_delivery?: string | null
          base_cost?: number | null
          cargo_type?: string | null
          contents?: string | null
          created_at?: string
          delivery_address?: string | null
          estimated_delivery?: string | null
          fragile_fee?: number | null
          from_city?: string | null
          has_insurance?: boolean | null
          id?: string
          insurance_cost?: number | null
          is_fragile?: boolean | null
          packages?: number | null
          pickup_address?: string | null
          receiver_name: string
          receiver_phone: string
          route: string
          sender_email?: string | null
          sender_name: string
          sender_phone: string
          service_type?: string | null
          status?: string
          to_city?: string | null
          total_cost?: number | null
          tracking_id: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          actual_delivery?: string | null
          base_cost?: number | null
          cargo_type?: string | null
          contents?: string | null
          created_at?: string
          delivery_address?: string | null
          estimated_delivery?: string | null
          fragile_fee?: number | null
          from_city?: string | null
          has_insurance?: boolean | null
          id?: string
          insurance_cost?: number | null
          is_fragile?: boolean | null
          packages?: number | null
          pickup_address?: string | null
          receiver_name?: string
          receiver_phone?: string
          route?: string
          sender_email?: string | null
          sender_name?: string
          sender_phone?: string
          service_type?: string | null
          status?: string
          to_city?: string | null
          total_cost?: number | null
          tracking_id?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
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
      generate_booking_ref: { Args: never; Returns: string }
      generate_quote_ref: { Args: never; Returns: string }
      generate_tracking_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

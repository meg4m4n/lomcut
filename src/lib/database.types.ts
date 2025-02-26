export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cuts: {
        Row: {
          id: string
          client_name: string
          client_brand: string
          reference: string
          description: string | null
          order_date: string
          deadline: string | null
          project_link: string | null
          gender: 'male' | 'female' | 'unisex' | 'boy' | 'girl'
          cut_type: '1st_proto' | '2nd_proto' | '3rd_proto' | 'size_set' | 'production'
          status: 'pending' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          client_name: string
          client_brand: string
          reference: string
          description?: string | null
          order_date?: string
          deadline?: string | null
          project_link?: string | null
          gender?: 'male' | 'female' | 'unisex' | 'boy' | 'girl'
          cut_type?: '1st_proto' | '2nd_proto' | '3rd_proto' | 'size_set' | 'production'
          status?: 'pending' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          client_name?: string
          client_brand?: string
          reference?: string
          description?: string | null
          order_date?: string
          deadline?: string | null
          project_link?: string | null
          gender?: 'male' | 'female' | 'unisex' | 'boy' | 'girl'
          cut_type?: '1st_proto' | '2nd_proto' | '3rd_proto' | 'size_set' | 'production'
          status?: 'pending' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      cut_materials: {
        Row: {
          id: string
          cut_id: string
          name: string
          supplier: string
          color: string
          width: number
          cut_ref: string | null
          sizes: Json
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          cut_id: string
          name: string
          supplier: string
          color: string
          width: number
          cut_ref?: string | null
          sizes?: Json
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          cut_id?: string
          name?: string
          supplier?: string
          color?: string
          width?: number
          cut_ref?: string | null
          sizes?: Json
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      cut_notes: {
        Row: {
          id: string
          cut_id: string
          content: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          cut_id: string
          content: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          cut_id?: string
          content?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      cut_registrations: {
        Row: {
          id: string
          cut_id: string
          material_id: string
          piece_status: Json
          marks: Json
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          cut_id: string
          material_id: string
          piece_status?: Json
          marks?: Json
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          cut_id?: string
          material_id?: string
          piece_status?: Json
          marks?: Json
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gender_type: 'male' | 'female' | 'unisex' | 'boy' | 'girl'
      cut_type: '1st_proto' | '2nd_proto' | '3rd_proto' | 'size_set' | 'production'
      cut_status: 'pending' | 'in_progress' | 'completed'
    }
  }
}
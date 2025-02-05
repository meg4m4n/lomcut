export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cuts: {
        Row: {
          id: string
          client_name: string
          client_brand: string
          order_date: string
          deadline: string | null
          model_reference: string
          description: string | null
          gender: 'male' | 'female' | 'unisex' | 'boy' | 'girl'
          type: '1st proto' | '2nd proto' | '3rd proto' | 'size-set' | 'production'
          project_link: string | null
          status: 'pending' | 'in-progress' | 'completed'
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          client_name: string
          client_brand: string
          order_date?: string
          deadline?: string | null
          model_reference: string
          description?: string | null
          gender?: 'male' | 'female' | 'unisex' | 'boy' | 'girl'
          type?: '1st proto' | '2nd proto' | '3rd proto' | 'size-set' | 'production'
          project_link?: string | null
          status?: 'pending' | 'in-progress' | 'completed'
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          client_name?: string
          client_brand?: string
          order_date?: string
          deadline?: string | null
          model_reference?: string
          description?: string | null
          gender?: 'male' | 'female' | 'unisex' | 'boy' | 'girl'
          type?: '1st proto' | '2nd proto' | '3rd proto' | 'size-set' | 'production'
          project_link?: string | null
          status?: 'pending' | 'in-progress' | 'completed'
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      materials: {
        Row: {
          id: string
          cut_id: string
          name: string
          supplier: string
          color: string
          width: number
          cut_ref: string | null
          dxf_file_url: string | null
          pdf_file_url: string | null
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
          dxf_file_url?: string | null
          pdf_file_url?: string | null
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
          dxf_file_url?: string | null
          pdf_file_url?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      sizes: {
        Row: {
          id: string
          material_id: string
          size: string
          quantity: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          material_id: string
          size: string
          quantity: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          material_id?: string
          size?: string
          quantity?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      services: {
        Row: {
          id: string
          material_id: string
          type: string
          enabled: boolean
          quantity: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          material_id: string
          type: string
          enabled: boolean
          quantity: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          material_id?: string
          type?: string
          enabled?: boolean
          quantity?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
    }
  }
}
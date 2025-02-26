/*
  # Initial Schema Setup for Cutting Management System

  1. New Tables
    - `cuts`
      - Main table for cut details
      - Stores basic information about each cut
    - `genders`
      - Lookup table for gender options
    - `cut_types`
      - Lookup table for cut types/typology
    - `statuses`
      - Lookup table for cut statuses
    - `cut_materials`
      - Junction table for cuts and their materials
      - Allows multiple materials per cut
    - `cut_notes`
      - Notes related to cuts
    - `cut_registrations`
      - Registration of cut pieces and their status
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum types for fixed values
CREATE TYPE gender_type AS ENUM (
  'male',
  'female',
  'unisex',
  'boy',
  'girl'
);

CREATE TYPE cut_type AS ENUM (
  '1st_proto',
  '2nd_proto',
  '3rd_proto',
  'size_set',
  'production'
);

CREATE TYPE cut_status AS ENUM (
  'pending',
  'in_progress',
  'completed'
);

-- Create the main cuts table
CREATE TABLE IF NOT EXISTS cuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_brand text NOT NULL,
  reference text NOT NULL,
  description text,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  deadline date,
  project_link text,
  gender gender_type NOT NULL DEFAULT 'unisex',
  cut_type cut_type NOT NULL DEFAULT '1st_proto',
  status cut_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Create materials table for cut details
CREATE TABLE IF NOT EXISTS cut_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cut_id uuid NOT NULL REFERENCES cuts(id) ON DELETE CASCADE,
  name text NOT NULL,
  supplier text NOT NULL,
  color text NOT NULL,
  width numeric(10,2) NOT NULL,
  cut_ref text,
  sizes jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Create notes table
CREATE TABLE IF NOT EXISTS cut_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cut_id uuid NOT NULL REFERENCES cuts(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Create cut registration table
CREATE TABLE IF NOT EXISTS cut_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cut_id uuid NOT NULL REFERENCES cuts(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES cut_materials(id) ON DELETE CASCADE,
  piece_status jsonb NOT NULL DEFAULT '{}',
  marks jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cut_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE cut_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cut_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cuts"
  ON cuts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cuts"
  ON cuts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cuts"
  ON cuts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cuts"
  ON cuts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Materials policies
CREATE POLICY "Users can view their own materials"
  ON cut_materials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own materials"
  ON cut_materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials"
  ON cut_materials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
  ON cut_materials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view their own notes"
  ON cut_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON cut_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON cut_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON cut_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Cut registration policies
CREATE POLICY "Users can view their own registrations"
  ON cut_registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own registrations"
  ON cut_registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations"
  ON cut_registrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own registrations"
  ON cut_registrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cuts_updated_at
  BEFORE UPDATE ON cuts
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cut_materials_updated_at
  BEFORE UPDATE ON cut_materials
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cut_notes_updated_at
  BEFORE UPDATE ON cut_notes
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cut_registrations_updated_at
  BEFORE UPDATE ON cut_registrations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
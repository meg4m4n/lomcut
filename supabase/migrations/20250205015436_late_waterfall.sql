/*
  # Initial Schema Setup for Cutting Management System

  1. New Tables
    - `cuts`
      - Main table for cut details
      - Stores basic cut information and client details
    - `materials`
      - Stores material information for each cut
      - Links to cuts table
    - `sizes`
      - Stores size quantities for materials
    - `services`
      - Stores service information for labels
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Enums
    - `cut_status`: pending, in-progress, completed
    - `gender_type`: male, female, unisex, boy, girl
    - `proto_type`: 1st proto, 2nd proto, 3rd proto, size-set, production
    - `service_type`: Various service types for labels
*/

-- Create enums
CREATE TYPE cut_status AS ENUM ('pending', 'in-progress', 'completed');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'unisex', 'boy', 'girl');
CREATE TYPE proto_type AS ENUM ('1st proto', '2nd proto', '3rd proto', 'size-set', 'production');
CREATE TYPE service_type AS ENUM (
  'ESTAMPARIA', 'TRANSFER', 'BORDADO', 'EMBOSSING', 'DTG', 'DTF',
  'PEDRAS', 'LAVANDARIA', 'TINGIMENTO', 'CORTE LASER', 'COLADOS', 'OUTROS'
);

-- Cuts table
CREATE TABLE cuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_brand text NOT NULL,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  deadline date,
  model_reference text NOT NULL,
  description text,
  gender gender_type NOT NULL DEFAULT 'unisex',
  type proto_type NOT NULL DEFAULT '1st proto',
  project_link text,
  status cut_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Materials table
CREATE TABLE materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cut_id uuid REFERENCES cuts(id) ON DELETE CASCADE,
  name text NOT NULL,
  supplier text NOT NULL,
  color text NOT NULL,
  width numeric(10,2) NOT NULL,
  cut_ref text,
  dxf_file_url text,
  pdf_file_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Sizes table
CREATE TABLE sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  size text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Services table for labels
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  type service_type NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own cuts"
  ON cuts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cuts"
  ON cuts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cuts"
  ON cuts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cuts"
  ON cuts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Similar policies for materials
CREATE POLICY "Users can read own materials"
  ON materials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own materials"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own materials"
  ON materials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own materials"
  ON materials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Similar policies for sizes
CREATE POLICY "Users can read own sizes"
  ON sizes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sizes"
  ON sizes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sizes"
  ON sizes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sizes"
  ON sizes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Similar policies for services
CREATE POLICY "Users can read own services"
  ON services FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services"
  ON services FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own services"
  ON services FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Triggers for updated_at
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
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sizes_updated_at
  BEFORE UPDATE ON sizes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
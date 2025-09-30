-- Create profiles table for user information
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pid text NOT NULL UNIQUE,
  business_partner text NOT NULL,
  end_user text NOT NULL,
  category text NOT NULL CHECK (category IN ('Implementation', 'Maintenance', 'LSC')),
  product text,
  pic text NOT NULL,
  pic_percentage numeric(5,2) DEFAULT 15.00,
  nett_gp bigint NOT NULL,
  keterangan text,
  quarter text NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Anyone authenticated can view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (true);

-- Create targets table
CREATE TABLE public.targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  q1_target bigint NOT NULL DEFAULT 0,
  q2_target bigint NOT NULL DEFAULT 0,
  q3_target bigint NOT NULL DEFAULT 0,
  q4_target bigint NOT NULL DEFAULT 0,
  yearly_target bigint NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(year)
);

-- Enable RLS
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;

-- Targets policies
CREATE POLICY "Anyone authenticated can view targets"
  ON public.targets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage targets"
  ON public.targets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to auto-generate PID
CREATE OR REPLACE FUNCTION generate_pid()
RETURNS text AS $$
DECLARE
  new_pid text;
  year_suffix text;
  counter integer;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');
  
  SELECT COUNT(*) + 1 INTO counter
  FROM public.projects
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  new_pid := 'P' || year_suffix || LPAD(counter::text, 4, '0');
  
  RETURN new_pid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate PID before insert
CREATE OR REPLACE FUNCTION set_project_pid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pid IS NULL OR NEW.pid = '' THEN
    NEW.pid := generate_pid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_project_pid
BEFORE INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION set_project_pid();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_targets_updated_at
BEFORE UPDATE ON public.targets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
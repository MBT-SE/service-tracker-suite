-- Fix search_path for all functions to address security warnings

-- Update generate_pid function
CREATE OR REPLACE FUNCTION public.generate_pid()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update set_project_pid function
CREATE OR REPLACE FUNCTION public.set_project_pid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pid IS NULL OR NEW.pid = '' THEN
    NEW.pid := generate_pid();
  END IF;
  RETURN NEW;
END;
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
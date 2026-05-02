-- BodyWise AI Supabase Schema
-- Run this in the Supabase SQL Editor to set up or fix your database tables.

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Analysis Results Table
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Food Logs Table
CREATE TABLE IF NOT EXISTS public.food_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'serving',
    meal_type TEXT NOT NULL DEFAULT 'snack',
    calories INTEGER NOT NULL DEFAULT 0,
    protein INTEGER NOT NULL DEFAULT 0,
    carbs INTEGER NOT NULL DEFAULT 0,
    fats INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habits Table
-- We add a custom_habits JSONB column to support dynamic/custom habits safely
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    water BOOLEAN DEFAULT false,
    sleep BOOLEAN DEFAULT false,
    protein BOOLEAN DEFAULT false,
    custom_habits JSONB DEFAULT '{}'::jsonb,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add custom_habits column to habits if it doesn't exist (Migration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='habits' AND column_name='custom_habits') THEN
        ALTER TABLE public.habits ADD COLUMN custom_habits JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 5b. Add unit column to food_logs if it doesn't exist (Migration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='food_logs' AND column_name='unit') THEN
        ALTER TABLE public.food_logs ADD COLUMN unit TEXT NOT NULL DEFAULT 'serving';
    END IF;
END $$;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- 7. Create Policies for User Data Isolation
-- Only allow users to select, insert, update, delete their OWN data
DROP POLICY IF EXISTS "Users can manage their own analysis_results" ON public.analysis_results;
CREATE POLICY "Users can manage their own analysis_results" 
ON public.analysis_results FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own food_logs" ON public.food_logs;
CREATE POLICY "Users can manage their own food_logs" 
ON public.food_logs FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;
CREATE POLICY "Users can manage their own habits" 
ON public.habits FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Verify that the DB is fully set up.

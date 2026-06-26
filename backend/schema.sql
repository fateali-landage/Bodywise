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

-- 8. Custom Foods Table
CREATE TABLE IF NOT EXISTS public.custom_foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    serving_size TEXT NOT NULL DEFAULT '1 serving',
    calories INTEGER NOT NULL DEFAULT 0,
    protein INTEGER NOT NULL DEFAULT 0,
    carbs INTEGER NOT NULL DEFAULT 0,
    fat INTEGER NOT NULL DEFAULT 0,
    fiber INTEGER NOT NULL DEFAULT 0,
    is_favorite BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

-- Policies for user data isolation
DROP POLICY IF EXISTS "Users can manage their own custom_foods" ON public.custom_foods;
CREATE POLICY "Users can manage their own custom_foods" 
ON public.custom_foods FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 9. User Goals Table
CREATE TABLE IF NOT EXISTS public.user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL,
    current_weight NUMERIC NOT NULL,
    target_weight NUMERIC NOT NULL,
    target_date DATE,
    weekly_goal TEXT,
    activity_level TEXT NOT NULL,
    height NUMERIC NOT NULL,
    gender TEXT NOT NULL,
    age INTEGER NOT NULL,
    daily_calorie_goal INTEGER NOT NULL,
    protein_goal INTEGER NOT NULL,
    carbs_goal INTEGER NOT NULL,
    fat_goal INTEGER NOT NULL,
    water_goal INTEGER NOT NULL DEFAULT 8,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Policies for user_goals
DROP POLICY IF EXISTS "Users can manage their own user_goals" ON public.user_goals;
CREATE POLICY "Users can manage their own user_goals" 
ON public.user_goals FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 10. Weight History Table
CREATE TABLE IF NOT EXISTS public.weight_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL,
    body_fat NUMERIC,
    muscle_mass NUMERIC,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

-- Policies for weight_history
DROP POLICY IF EXISTS "Users can manage their own weight_history" ON public.weight_history;
CREATE POLICY "Users can manage their own weight_history" 
ON public.weight_history FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);


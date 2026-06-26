-- =============================================================================
-- BodyWise AI - Production Database Migration
-- Project : eittkokstntbpbdhgstj
-- Tables  : user_goals | weight_history | custom_foods
-- Run in  : Supabase Dashboard -> SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Shared trigger function - keeps updated_at current on every UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =============================================================================
-- TABLE: public.user_goals
-- One row per user (UNIQUE on user_id).
-- Stores fitness goal parameters and computed daily macro targets.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_goals (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL UNIQUE
                                   REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type          TEXT        NOT NULL,
    current_weight     NUMERIC     NOT NULL CHECK (current_weight > 0),
    target_weight      NUMERIC     NOT NULL CHECK (target_weight > 0),
    target_date        DATE,
    weekly_goal        TEXT,
    activity_level     TEXT        NOT NULL,
    height             NUMERIC     NOT NULL CHECK (height > 0),
    gender             TEXT        NOT NULL,
    age                INTEGER     NOT NULL CHECK (age > 0),
    daily_calorie_goal INTEGER     NOT NULL CHECK (daily_calorie_goal > 0),
    protein_goal       INTEGER     NOT NULL CHECK (protein_goal >= 0),
    carbs_goal         INTEGER     NOT NULL CHECK (carbs_goal >= 0),
    fat_goal           INTEGER     NOT NULL CHECK (fat_goal >= 0),
    water_goal         INTEGER     NOT NULL DEFAULT 8,
    status             TEXT        NOT NULL DEFAULT 'active',
    created_at         TIMESTAMPTZ          DEFAULT NOW(),
    updated_at         TIMESTAMPTZ          DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id
    ON public.user_goals (user_id);

-- Row Level Security
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_goals" ON public.user_goals;
CREATE POLICY "users_manage_own_goals"
    ON public.user_goals
    FOR ALL
    USING      (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS tr_user_goals_updated_at ON public.user_goals;
CREATE TRIGGER tr_user_goals_updated_at
    BEFORE UPDATE ON public.user_goals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- =============================================================================
-- TABLE: public.weight_history
-- Many rows per user - one entry per weigh-in date.
-- Optionally stores body-fat % and muscle-mass kg alongside weight.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.weight_history (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL
                             REFERENCES auth.users(id) ON DELETE CASCADE,
    weight       NUMERIC     NOT NULL CHECK (weight > 0),
    body_fat     NUMERIC     CHECK (body_fat IS NULL OR (body_fat >= 0 AND body_fat <= 100)),
    muscle_mass  NUMERIC     CHECK (muscle_mass IS NULL OR muscle_mass >= 0),
    recorded_at  DATE        NOT NULL DEFAULT CURRENT_DATE,
    notes        TEXT,
    created_at   TIMESTAMPTZ          DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weight_history_user_id
    ON public.weight_history (user_id);

CREATE INDEX IF NOT EXISTS idx_weight_history_recorded_at
    ON public.weight_history (user_id, recorded_at DESC);

-- Row Level Security
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_weight" ON public.weight_history;
CREATE POLICY "users_manage_own_weight"
    ON public.weight_history
    FOR ALL
    USING      (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- =============================================================================
-- TABLE: public.custom_foods
-- User-defined foods for the Calorie Tracker.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.custom_foods (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL
                              REFERENCES auth.users(id) ON DELETE CASCADE,
    food_name     TEXT        NOT NULL,
    serving_size  TEXT        NOT NULL DEFAULT '1 serving',
    calories      INTEGER     NOT NULL DEFAULT 0 CHECK (calories >= 0),
    protein       INTEGER     NOT NULL DEFAULT 0 CHECK (protein >= 0),
    carbs         INTEGER     NOT NULL DEFAULT 0 CHECK (carbs >= 0),
    fat           INTEGER     NOT NULL DEFAULT 0 CHECK (fat >= 0),
    fiber         INTEGER     NOT NULL DEFAULT 0 CHECK (fiber >= 0),
    is_favorite   BOOLEAN              DEFAULT false,
    notes         TEXT,
    created_at    TIMESTAMPTZ          DEFAULT NOW(),
    updated_at    TIMESTAMPTZ          DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_custom_foods_user_id
    ON public.custom_foods (user_id);

CREATE INDEX IF NOT EXISTS idx_custom_foods_favorite
    ON public.custom_foods (user_id, is_favorite)
    WHERE is_favorite = true;

-- Row Level Security
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_custom_foods" ON public.custom_foods;
CREATE POLICY "users_manage_own_custom_foods"
    ON public.custom_foods
    FOR ALL
    USING      (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS tr_custom_foods_updated_at ON public.custom_foods;
CREATE TRIGGER tr_custom_foods_updated_at
    BEFORE UPDATE ON public.custom_foods
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- =============================================================================
-- Verification - run after migration to confirm all 3 tables were created
-- Expected output: 3 rows with table_name and column_count
-- =============================================================================
SELECT
    table_name,
    (
        SELECT COUNT(*)
        FROM information_schema.columns c
        WHERE c.table_name = t.table_name
          AND c.table_schema = 'public'
    ) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('user_goals', 'weight_history', 'custom_foods')
ORDER BY table_name;

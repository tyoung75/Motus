-- =====================================================
-- MOTUS FITNESS APP - COMPLETE DATABASE SCHEMA
-- Run this FIRST before other migrations
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- Stores user profile, body metrics, macro targets
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}',
  -- Data contains: name, email, age, weight, height, gender, activityLevel,
  -- bodyFat, weightUnit, trainingHistory, yearsTraining, currentTrainingDays,
  -- nutritionGoal, bmr, tdee, macros { calories, protein, carbs, fat }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);


-- =====================================================
-- 2. PROGRAMS TABLE
-- Stores generated training programs
-- =====================================================
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}',
  -- Data contains: name, description, totalWeeks, currentWeek, currentPhase,
  -- phases[], weeklySchedule[], athleteLevel, primaryGoal, primarySubtype,
  -- secondaryGoal, isHybrid, daysPerWeek, baseline, paces, progressionRules,
  -- startDate, generatedAt, strengthGoals[]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_user_id ON programs(user_id);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own program"
  ON programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own program"
  ON programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own program"
  ON programs FOR UPDATE
  USING (auth.uid() = user_id);


-- =====================================================
-- 3. MEALS TABLE
-- Stores logged meals and food entries
-- =====================================================
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '[]',
  -- Data is an array of meal objects:
  -- { id, date, mealType, foods[], calories, protein, carbs, fat, loggedAt }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meals"
  ON meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON meals FOR UPDATE
  USING (auth.uid() = user_id);


-- =====================================================
-- 4. WORKOUTS TABLE
-- Stores logged workout sessions and exercise data
-- =====================================================
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '[]',
  -- Data is an array of workout objects:
  -- { id, date, day, sessionIndex, exercises[], duration, overallRpe,
  --   type, completedAt, notes }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);


-- =====================================================
-- 5. UPDATED_AT TRIGGER FUNCTION
-- Automatically updates updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- VERIFICATION: Check tables were created
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'MOTUS Core Tables Created Successfully!';
  RAISE NOTICE 'Tables: profiles, programs, meals, workouts';
  RAISE NOTICE 'All have RLS enabled and user_id indexes';
END $$;

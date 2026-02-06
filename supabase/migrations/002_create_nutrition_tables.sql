-- Create nutrition preferences and meal plans tables

-- Nutrition preferences for meal plan generation
CREATE TABLE IF NOT EXISTS nutrition_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  dietary_restrictions TEXT[] DEFAULT '{}',
  excluded_days TEXT[] DEFAULT '{}',
  favorite_breakfast TEXT,
  favorite_lunch TEXT,
  favorite_dinner TEXT,
  favorite_snacks TEXT,
  cuisine_preferences TEXT[] DEFAULT '{}',
  disliked_foods TEXT[] DEFAULT '{}',
  additional_notes TEXT,
  servings_per_meal INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated meal plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  week_start DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  meals JSONB NOT NULL DEFAULT '{}',
  shopping_list JSONB DEFAULT '{}',
  user_feedback TEXT,
  regeneration_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nutrition_preferences_user_id ON nutrition_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start ON meal_plans(week_start);
CREATE INDEX IF NOT EXISTS idx_meal_plans_status ON meal_plans(status);

-- Enable Row Level Security
ALTER TABLE nutrition_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nutrition_preferences
CREATE POLICY "Users can view their own preferences"
  ON nutrition_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON nutrition_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON nutrition_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for meal_plans
CREATE POLICY "Users can view their own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);

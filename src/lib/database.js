import { supabase, isSupabaseConfigured } from './supabase';

// Helper to get current user ID
const getUserId = async () => {
  if (!isSupabaseConfigured()) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

// Profile operations
export const saveProfile = async (profile) => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    localStorage.setItem('motus_profile', JSON.stringify(profile));
    return { data: profile, error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      data: profile,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select()
    .single();

  // Also save to localStorage as backup
  localStorage.setItem('motus_profile', JSON.stringify(profile));

  return { data: data?.data || profile, error };
};

export const loadProfile = async () => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    const local = localStorage.getItem('motus_profile');
    return { data: local ? JSON.parse(local) : null, error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('data')
    .eq('user_id', userId)
    .single();

  if (data?.data) {
    localStorage.setItem('motus_profile', JSON.stringify(data.data));
    return { data: data.data, error: null };
  }

  // Fall back to localStorage
  const local = localStorage.getItem('motus_profile');
  return { data: local ? JSON.parse(local) : null, error };
};

// Program operations
export const saveProgram = async (program) => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    localStorage.setItem('motus_program', JSON.stringify(program));
    return { data: program, error: null };
  }

  const { data, error } = await supabase
    .from('programs')
    .upsert({
      user_id: userId,
      data: program,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select()
    .single();

  localStorage.setItem('motus_program', JSON.stringify(program));

  return { data: data?.data || program, error };
};

export const loadProgram = async () => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    const local = localStorage.getItem('motus_program');
    return { data: local ? JSON.parse(local) : null, error: null };
  }

  const { data, error } = await supabase
    .from('programs')
    .select('data')
    .eq('user_id', userId)
    .single();

  if (data?.data) {
    localStorage.setItem('motus_program', JSON.stringify(data.data));
    return { data: data.data, error: null };
  }

  const local = localStorage.getItem('motus_program');
  return { data: local ? JSON.parse(local) : null, error };
};

// Meals operations
export const saveMeals = async (meals) => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    localStorage.setItem('motus_meals', JSON.stringify(meals));
    return { data: meals, error: null };
  }

  const { data, error } = await supabase
    .from('meals')
    .upsert({
      user_id: userId,
      data: meals,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select()
    .single();

  localStorage.setItem('motus_meals', JSON.stringify(meals));

  return { data: data?.data || meals, error };
};

export const loadMeals = async () => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    const local = localStorage.getItem('motus_meals');
    return { data: local ? JSON.parse(local) : [], error: null };
  }

  const { data, error } = await supabase
    .from('meals')
    .select('data')
    .eq('user_id', userId)
    .single();

  if (data?.data) {
    localStorage.setItem('motus_meals', JSON.stringify(data.data));
    return { data: data.data, error: null };
  }

  const local = localStorage.getItem('motus_meals');
  return { data: local ? JSON.parse(local) : [], error };
};

// Workouts operations
export const saveWorkouts = async (workouts) => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    localStorage.setItem('motus_workouts', JSON.stringify(workouts));
    return { data: workouts, error: null };
  }

  const { data, error } = await supabase
    .from('workouts')
    .upsert({
      user_id: userId,
      data: workouts,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select()
    .single();

  localStorage.setItem('motus_workouts', JSON.stringify(workouts));

  return { data: data?.data || workouts, error };
};

export const loadWorkouts = async () => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    const local = localStorage.getItem('motus_workouts');
    return { data: local ? JSON.parse(local) : [], error: null };
  }

  const { data, error } = await supabase
    .from('workouts')
    .select('data')
    .eq('user_id', userId)
    .single();

  if (data?.data) {
    localStorage.setItem('motus_workouts', JSON.stringify(data.data));
    return { data: data.data, error: null };
  }

  const local = localStorage.getItem('motus_workouts');
  return { data: local ? JSON.parse(local) : [], error };
};

// Sync all local data to cloud after login
export const syncLocalToCloud = async () => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) return;

  const localProfile = localStorage.getItem('motus_profile');
  const localProgram = localStorage.getItem('motus_program');
  const localMeals = localStorage.getItem('motus_meals');
  const localWorkouts = localStorage.getItem('motus_workouts');

  // Check if user has existing cloud data
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('data')
    .eq('user_id', userId)
    .single();

  // If no cloud data exists but local data does, sync it up
  if (!existingProfile && localProfile) {
    await saveProfile(JSON.parse(localProfile));
  }
  if (!existingProfile && localProgram) {
    await saveProgram(JSON.parse(localProgram));
  }
  if (!existingProfile && localMeals) {
    await saveMeals(JSON.parse(localMeals));
  }
  if (!existingProfile && localWorkouts) {
    await saveWorkouts(JSON.parse(localWorkouts));
  }
};

// ============ SUBSCRIPTION OPERATIONS ============

export const saveSubscription = async (subscriptionData) => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    localStorage.setItem('motus_subscription', JSON.stringify(subscriptionData));
    return { data: subscriptionData, error: null };
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      ...subscriptionData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (data) {
    localStorage.setItem('motus_subscription', JSON.stringify(data));
  }

  return { data, error };
};

export const loadSubscription = async () => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    const local = localStorage.getItem('motus_subscription');
    return { data: local ? JSON.parse(local) : null, error: null };
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) {
    localStorage.setItem('motus_subscription', JSON.stringify(data));
    return { data, error: null };
  }

  const local = localStorage.getItem('motus_subscription');
  return { data: local ? JSON.parse(local) : null, error };
};

// ============ REFERRAL OPERATIONS ============

export const loadReferrals = async () => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
};

export const createReferral = async (refereeEmail) => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    return { data: null, error: new Error('Not authenticated') };
  }

  // Get user's referral code
  const { data: subscription } = await loadSubscription();
  if (!subscription?.referral_code) {
    return { data: null, error: new Error('No referral code found') };
  }

  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: userId,
      referee_email: refereeEmail,
      referral_code: subscription.referral_code,
      status: 'pending'
    })
    .select()
    .single();

  return { data, error };
};

export const completeReferral = async (referralCode, refereeId) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  // Find pending referral with this code
  const { data: referral, error: findError } = await supabase
    .from('referrals')
    .select('*')
    .eq('referral_code', referralCode)
    .eq('status', 'pending')
    .single();

  if (findError || !referral) {
    return { data: null, error: findError || new Error('Referral not found') };
  }

  // Complete the referral
  const { data, error } = await supabase
    .from('referrals')
    .update({
      referee_id: refereeId,
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', referral.id)
    .select()
    .single();

  return { data, error };
};

export const verifyReferralCode = async (code) => {
  if (!isSupabaseConfigured()) {
    return { valid: false, error: new Error('Supabase not configured') };
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id, referral_code')
    .eq('referral_code', code)
    .single();

  return { valid: !!data, referrerId: data?.user_id, error };
};

// ============ NUTRITION PREFERENCES OPERATIONS ============

export const saveNutritionPreferences = async (preferences) => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    localStorage.setItem('motus_nutrition_preferences', JSON.stringify(preferences));
    return { data: preferences, error: null };
  }

  const { data, error } = await supabase
    .from('nutrition_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (data) {
    localStorage.setItem('motus_nutrition_preferences', JSON.stringify(data));
  }

  return { data, error };
};

export const loadNutritionPreferences = async () => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    const local = localStorage.getItem('motus_nutrition_preferences');
    return { data: local ? JSON.parse(local) : null, error: null };
  }

  const { data, error } = await supabase
    .from('nutrition_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) {
    localStorage.setItem('motus_nutrition_preferences', JSON.stringify(data));
    return { data, error: null };
  }

  const local = localStorage.getItem('motus_nutrition_preferences');
  return { data: local ? JSON.parse(local) : null, error };
};

// ============ MEAL PLAN OPERATIONS ============

export const saveMealPlan = async (mealPlan) => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    localStorage.setItem('motus_meal_plan', JSON.stringify(mealPlan));
    return { data: mealPlan, error: null };
  }

  const { data, error } = await supabase
    .from('meal_plans')
    .upsert({
      user_id: userId,
      ...mealPlan,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    .select()
    .single();

  if (data) {
    localStorage.setItem('motus_meal_plan', JSON.stringify(data));
  }

  return { data, error };
};

export const loadActiveMealPlan = async () => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    const local = localStorage.getItem('motus_meal_plan');
    return { data: local ? JSON.parse(local) : null, error: null };
  }

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (data) {
    localStorage.setItem('motus_meal_plan', JSON.stringify(data));
    return { data, error: null };
  }

  const local = localStorage.getItem('motus_meal_plan');
  return { data: local ? JSON.parse(local) : null, error };
};

export const createMealPlan = async (meals, shoppingList, weekStart) => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    const plan = { meals, shopping_list: shoppingList, week_start: weekStart, status: 'active' };
    localStorage.setItem('motus_meal_plan', JSON.stringify(plan));
    return { data: plan, error: null };
  }

  // Archive any existing active plans
  await supabase
    .from('meal_plans')
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .eq('status', 'active');

  // Create new active plan
  const { data, error } = await supabase
    .from('meal_plans')
    .insert({
      user_id: userId,
      week_start: weekStart,
      meals,
      shopping_list: shoppingList,
      status: 'active'
    })
    .select()
    .single();

  if (data) {
    localStorage.setItem('motus_meal_plan', JSON.stringify(data));
  }

  return { data, error };
};

export const updateMealPlanFeedback = async (planId, feedback) => {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured()) {
    const local = localStorage.getItem('motus_meal_plan');
    if (local) {
      const plan = JSON.parse(local);
      plan.user_feedback = feedback;
      localStorage.setItem('motus_meal_plan', JSON.stringify(plan));
      return { data: plan, error: null };
    }
    return { data: null, error: new Error('No meal plan found') };
  }

  const { data, error } = await supabase
    .from('meal_plans')
    .update({
      user_feedback: feedback,
      updated_at: new Date().toISOString()
    })
    .eq('id', planId)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error };
};

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

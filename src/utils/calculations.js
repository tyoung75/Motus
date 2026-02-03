export const calculateBMR = (weight, height, age, sex) => {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
};

export const calculateTDEE = (bmr, activityLevel) => {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.55));
};

export const calculateMacros = (tdee, goal, weight) => {
  let calories, proteinRatio, carbRatio, fatRatio;
  switch (goal) {
    case 'lose':
      calories = Math.round(tdee * 0.8);
      proteinRatio = 0.35; carbRatio = 0.35; fatRatio = 0.30;
      break;
    case 'gain':
      calories = Math.round(tdee * 1.15);
      proteinRatio = 0.30; carbRatio = 0.45; fatRatio = 0.25;
      break;
    default:
      calories = tdee;
      proteinRatio = 0.30; carbRatio = 0.40; fatRatio = 0.30;
  }
  const minProtein = Math.round(weight * 1.6);
  const proteinFromRatio = Math.round((calories * proteinRatio) / 4);
  const protein = Math.max(minProtein, proteinFromRatio);
  const remainingCals = calories - (protein * 4);
  const carbs = Math.round((remainingCals * (carbRatio / (carbRatio + fatRatio))) / 4);
  const fat = Math.round((remainingCals * (fatRatio / (carbRatio + fatRatio))) / 9);
  return { calories, protein, carbs, fat };
};

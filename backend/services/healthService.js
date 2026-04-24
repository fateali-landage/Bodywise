export const calculateBmi = ({ weight, height }) => {
  const safeWeight = Number(weight);
  const safeHeightCm = Number(height);
  const safeHeightM = safeHeightCm / 100;
  if (!safeWeight || !safeHeightM) return 0;
  return Number((safeWeight / (safeHeightM * safeHeightM)).toFixed(1));
};

export const bmiStatus = (bmi) => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obesity Risk";
};

export interface CountryScore {
  name: string;
  rank: number;
  score: number;
  region: string;
  strengths: number;
  opportunities: number;
  weaknesses: number;
  threats: number;
  gdpGrowth: number;
  businessReady: number;
  idi: number;
  corruption: number;
  urbanization: number;
  debtToGdp: number;
}

export const countryScores: CountryScore[] = [
  { name: "Botswana", rank: 1, score: 78.58, region: "Southern Africa", strengths: 66.60, opportunities: 77.32, weaknesses: 82.70, threats: 94.31, gdpGrowth: -0.1, businessReady: 50.0, idi: 78.7, corruption: 58.0, urbanization: 67.0, debtToGdp: 24.9 },
  { name: "Seychelles", rank: 2, score: 76.69, region: "East Africa", strengths: 74.42, opportunities: 78.49, weaknesses: 73.53, threats: 80.53, gdpGrowth: 8.8, businessReady: 40.86, idi: 84.7, corruption: 68.0, urbanization: 63.0, debtToGdp: 61.0 },
  { name: "South Africa", rank: 3, score: 74.75, region: "Southern Africa", strengths: 70.17, opportunities: 78.45, weaknesses: 77.12, threats: 73.70, gdpGrowth: 0.6, businessReady: 53.0, idi: 83.6, corruption: 41.0, urbanization: 64.0, debtToGdp: 78.9 },
  { name: "Mauritius", rank: 4, score: 73.46, region: "East Africa", strengths: 81.99, opportunities: 76.84, weaknesses: 56.58, threats: 72.48, gdpGrowth: 2.8, businessReady: 63.2, idi: 84.2, corruption: 48.0, urbanization: 61.0, debtToGdp: 82.1 },
  { name: "Morocco", rank: 5, score: 72.64, region: "North Africa", strengths: 84.39, opportunities: 76.50, weaknesses: 44.77, threats: 77.10, gdpGrowth: 4.1, businessReady: 63.44, idi: 86.8, corruption: 39.0, urbanization: 58.0, debtToGdp: 70.0 },
  { name: "Djibouti", rank: 6, score: 71.45, region: "East Africa", strengths: 71.03, opportunities: 74.37, weaknesses: 48.06, threats: 91.11, gdpGrowth: 6.8, businessReady: 40.86, idi: 61.6, corruption: 31.0, urbanization: 79.0, debtToGdp: 33.3 },
  { name: "Algeria", rank: 7, score: 69.80, region: "North Africa", strengths: 60.66, opportunities: 84.72, weaknesses: 44.72, threats: 86.18, gdpGrowth: 3.9, businessReady: 34.0, idi: 80.9, corruption: 34.0, urbanization: 76.0, debtToGdp: 46.2 },
  { name: "Gabon", rank: 8, score: 69.57, region: "Central Africa", strengths: 64.93, opportunities: 91.42, weaknesses: 37.54, threats: 75.80, gdpGrowth: 3.2, businessReady: 40.86, idi: 74.7, corruption: 29.0, urbanization: 92.0, debtToGdp: 73.4 },
  { name: "Cape Verde", rank: 9, score: 68.66, region: "West Africa", strengths: 71.88, opportunities: 71.84, weaknesses: 65.50, threats: 62.21, gdpGrowth: 7.3, businessReady: 40.86, idi: 69.1, corruption: 62.0, urbanization: 68.0, debtToGdp: 109.0 },
  { name: "Benin", rank: 10, score: 68.57, region: "West Africa", strengths: 87.76, opportunities: 41.33, weaknesses: 65.80, threats: 83.44, gdpGrowth: 7.6, businessReady: 60.21, idi: 45.4, corruption: 45.0, urbanization: 45.0, debtToGdp: 53.4 },
  { name: "Ivory Coast", rank: 11, score: 68.46, region: "West Africa", strengths: 80.79, opportunities: 60.07, weaknesses: 49.40, threats: 81.60, gdpGrowth: 6.2, businessReady: 54.43, idi: 65.3, corruption: 43.0, urbanization: 54.0, debtToGdp: 58.2 },
  { name: "Rwanda", rank: 12, score: 67.68, region: "East Africa", strengths: 100.0, opportunities: 24.23, weaknesses: 73.88, threats: 78.17, gdpGrowth: 11.2, businessReady: 67.94, idi: 46.8, corruption: 58.0, urbanization: 18.0, debtToGdp: 67.2 },
  { name: "Ghana", rank: 13, score: 67.46, region: "West Africa", strengths: 77.39, opportunities: 61.31, weaknesses: 52.34, threats: 76.91, gdpGrowth: 5.8, businessReady: 51.0, idi: 66.2, corruption: 43.0, urbanization: 55.0, debtToGdp: 70.5 },
  { name: "Namibia", rank: 14, score: 66.81, region: "Southern Africa", strengths: 66.02, opportunities: 59.64, weaknesses: 66.65, threats: 78.89, gdpGrowth: 0.5, businessReady: 48.0, idi: 68.8, corruption: 46.0, urbanization: 50.0, debtToGdp: 65.3 },
  { name: "Tunisia", rank: 15, score: 66.20, region: "North Africa", strengths: 67.94, opportunities: 79.02, weaknesses: 37.19, threats: 73.36, gdpGrowth: 2.1, businessReady: 47.0, idi: 77.2, corruption: 39.0, urbanization: 71.0, debtToGdp: 79.8 },
  { name: "Senegal", rank: 16, score: 65.92, region: "West Africa", strengths: 78.69, opportunities: 63.30, weaknesses: 57.83, threats: 58.78, gdpGrowth: 4.2, businessReady: 56.05, idi: 69.3, corruption: 46.0, urbanization: 55.0, debtToGdp: 118.0 },
  { name: "Egypt", rank: 17, score: 65.70, region: "North Africa", strengths: 68.52, opportunities: 63.29, weaknesses: 58.97, threats: 71.83, gdpGrowth: 5.32, businessReady: 40.86, idi: 76.8, corruption: 30.0, urbanization: 47.79, debtToGdp: 83.8 },
  { name: "Eswatini", rank: 18, score: 64.62, region: "Southern Africa", strengths: 66.03, opportunities: 59.19, weaknesses: 38.82, threats: 96.45, gdpGrowth: 3.85, businessReady: 40.86, idi: 70.4, corruption: 31.98, urbanization: 47.79, debtToGdp: 19.3 },
  { name: "Libya", rank: 19, score: 62.89, region: "North Africa", strengths: 43.44, opportunities: 93.33, weaknesses: 9.27, threats: 100.0, gdpGrowth: 0.3, businessReady: 20.0, idi: 88.1, corruption: 13.0, urbanization: 82.0, debtToGdp: 10.0 },
  { name: "Mauritania", rank: 20, score: 62.37, region: "West Africa", strengths: 70.18, opportunities: 55.13, weaknesses: 35.44, threats: 88.44, gdpGrowth: 6.3, businessReady: 40.86, idi: 55.5, corruption: 30.0, urbanization: 56.0, debtToGdp: 40.3 },
  { name: "Sao Tome and Principe", rank: 21, score: 61.95, region: "Central Africa", strengths: 62.05, opportunities: 69.39, weaknesses: 39.33, threats: 73.28, gdpGrowth: 1.5, businessReady: 40.86, idi: 55.9, corruption: 45.0, urbanization: 77.0, debtToGdp: 80.0 },
  { name: "Congo, Rep.", rank: 22, score: 61.59, region: "Central Africa", strengths: 70.86, opportunities: 44.59, weaknesses: 38.33, threats: 96.45, gdpGrowth: 6.7, businessReady: 40.86, idi: 30.7, corruption: 23.0, urbanization: 64.0, debtToGdp: 19.3 },
  { name: "Nigeria", rank: 23, score: 60.50, region: "West Africa", strengths: 69.69, opportunities: 48.96, weaknesses: 40.88, threats: 83.63, gdpGrowth: 4.07, businessReady: 45.0, idi: 46.9, corruption: 26.0, urbanization: 55.0, debtToGdp: 52.9 },
  { name: "Togo", rank: 24, score: 60.21, region: "West Africa", strengths: 86.43, opportunities: 41.84, weaknesses: 31.26, threats: 77.40, gdpGrowth: 6.2, businessReady: 61.52, idi: 46.2, corruption: 32.0, urbanization: 45.0, debtToGdp: 69.2 },
  { name: "Zambia", rank: 25, score: 58.63, region: "Southern Africa", strengths: 66.51, opportunities: 47.86, weaknesses: 44.32, threats: 77.25, gdpGrowth: 3.6, businessReady: 42.0, idi: 55.6, corruption: 37.0, urbanization: 45.0, debtToGdp: 69.6 },
  { name: "Gambia, The", rank: 26, score: 58.49, region: "West Africa", strengths: 69.17, opportunities: 47.34, weaknesses: 41.38, threats: 76.34, gdpGrowth: 5.7, businessReady: 40.86, idi: 35.0, corruption: 37.0, urbanization: 64.0, debtToGdp: 72.0 },
  { name: "Kenya", rank: 27, score: 58.43, region: "East Africa", strengths: 76.66, opportunities: 41.05, weaknesses: 38.38, threats: 77.21, gdpGrowth: 4.9, businessReady: 52.0, idi: 58.5, corruption: 30.0, urbanization: 32.0, debtToGdp: 69.7 },
  { name: "Tanzania", rank: 28, score: 58.23, region: "East Africa", strengths: 72.05, opportunities: 33.86, weaknesses: 46.86, threats: 85.42, gdpGrowth: 6.4, businessReady: 43.0, idi: 43.1, corruption: 40.0, urbanization: 36.0, debtToGdp: 48.2 },
  { name: "Guinea", rank: 29, score: 56.13, region: "West Africa", strengths: 68.99, opportunities: 32.14, weaknesses: 37.94, threats: 90.99, gdpGrowth: 5.6, businessReady: 40.86, idi: 30.0, corruption: 26.0, urbanization: 46.0, debtToGdp: 33.6 },
  { name: "Cameroon", rank: 30, score: 55.34, region: "Central Africa", strengths: 61.46, opportunities: 47.23, weaknesses: 26.17, threats: 87.52, gdpGrowth: 3.9, businessReady: 35.0, idi: 44.2, corruption: 26.0, urbanization: 55.0, debtToGdp: 42.7 },
  { name: "Uganda", rank: 31, score: 55.20, region: "East Africa", strengths: 76.41, opportunities: 28.80, weaknesses: 34.15, threats: 84.05, gdpGrowth: 8.5, businessReady: 44.0, idi: 40.4, corruption: 25.0, urbanization: 31.0, debtToGdp: 51.8 },
  { name: "Angola", rank: 32, score: 55.08, region: "Southern Africa", strengths: 62.30, opportunities: 46.07, weaknesses: 31.26, threats: 81.60, gdpGrowth: 5.8, businessReady: 32.0, idi: 49.9, corruption: 32.0, urbanization: 47.79, debtToGdp: 58.2 },
  { name: "Liberia", rank: 33, score: 55.02, region: "West Africa", strengths: 68.15, opportunities: 35.35, weaknesses: 36.69, threats: 83.17, gdpGrowth: 5.1, businessReady: 40.86, idi: 37.1, corruption: 28.0, urbanization: 44.0, debtToGdp: 54.1 },
  { name: "Ethiopia", rank: 34, score: 54.66, region: "East Africa", strengths: 71.19, opportunities: 23.75, weaknesses: 39.28, threats: 91.60, gdpGrowth: 7.3, businessReady: 40.0, idi: 39.8, corruption: 38.0, urbanization: 24.0, debtToGdp: 32.0 },
  { name: "Burkina Faso", rank: 35, score: 54.44, region: "West Africa", strengths: 71.03, opportunities: 26.87, weaknesses: 43.92, threats: 81.45, gdpGrowth: 6.8, businessReady: 40.86, idi: 30.1, corruption: 40.0, urbanization: 38.0, debtToGdp: 58.6 },
  { name: "Sierra Leone", rank: 36, score: 54.17, region: "West Africa", strengths: 66.11, opportunities: 34.22, weaknesses: 32.95, threats: 87.40, gdpGrowth: 3.9, businessReady: 40.86, idi: 34.3, corruption: 34.0, urbanization: 45.0, debtToGdp: 43.0 },
  { name: "Lesotho", rank: 37, score: 53.47, region: "Southern Africa", strengths: 65.57, opportunities: 34.84, weaknesses: 35.49, threats: 81.26, gdpGrowth: 3.58, businessReady: 40.86, idi: 48.8, corruption: 37.0, urbanization: 32.0, debtToGdp: 59.1 },
  { name: "Guinea-Bissau", rank: 38, score: 53.43, region: "West Africa", strengths: 68.99, opportunities: 35.89, weaknesses: 36.64, threats: 73.17, gdpGrowth: 5.6, businessReady: 40.86, idi: 36.9, corruption: 21.0, urbanization: 45.0, debtToGdp: 80.3 },
  { name: "Equatorial Guinea", rank: 39, score: 53.33, region: "Central Africa", strengths: 61.54, opportunities: 46.95, weaknesses: 13.91, threats: 90.0, gdpGrowth: 1.2, businessReady: 40.86, idi: 44.8, corruption: 15.0, urbanization: 54.0, debtToGdp: 36.2 },
  { name: "Mali", rank: 40, score: 53.07, region: "West Africa", strengths: 57.08, opportunities: 38.80, weaknesses: 42.57, threats: 78.95, gdpGrowth: 4.6, businessReady: 28.0, idi: 40.4, corruption: 28.0, urbanization: 46.0, debtToGdp: 65.16 },
  { name: "Comoros", rank: 41, score: 52.21, region: "East Africa", strengths: 65.27, opportunities: 34.70, weaknesses: 18.15, threats: 92.98, gdpGrowth: 3.4, businessReady: 40.86, idi: 46.5, corruption: 20.0, urbanization: 34.0, debtToGdp: 28.4 },
  { name: "Congo, Dem. Rep.", rank: 42, score: 50.81, region: "Central Africa", strengths: 63.74, opportunities: 38.78, weaknesses: 32.85, threats: 67.40, gdpGrowth: 2.5, businessReady: 40.86, idi: 31.0, corruption: 20.0, urbanization: 55.0, debtToGdp: 95.4 },
  { name: "Zimbabwe", rank: 43, score: 50.47, region: "Southern Africa", strengths: 60.62, opportunities: 39.47, weaknesses: 31.61, threats: 70.61, gdpGrowth: 2.0, businessReady: 38.0, idi: 47.7, corruption: 22.0, urbanization: 40.0, debtToGdp: 87.0 },
  { name: "Central African Republic", rank: 44, score: 49.06, region: "Central Africa", strengths: 61.20, opportunities: 24.40, weaknesses: 36.24, threats: 80.65, gdpGrowth: 1.0, businessReady: 40.86, idi: 20.0, corruption: 24.0, urbanization: 44.0, debtToGdp: 60.7 },
  { name: "Madagascar", rank: 45, score: 48.52, region: "East Africa", strengths: 54.19, opportunities: 27.41, weaknesses: 31.21, threats: 89.01, gdpGrowth: 4.3, businessReady: 25.0, idi: 29.9, corruption: 25.0, urbanization: 39.0, debtToGdp: 38.8 },
  { name: "Chad", rank: 46, score: 47.85, region: "Central Africa", strengths: 64.76, opportunities: 13.90, weaknesses: 30.36, threats: 90.92, gdpGrowth: 3.1, businessReady: 40.86, idi: 21.3, corruption: 22.0, urbanization: 27.0, debtToGdp: 33.8 },
  { name: "Burundi", rank: 47, score: 46.50, region: "East Africa", strengths: 66.11, opportunities: 14.55, weaknesses: 12.66, threats: 98.82, gdpGrowth: 3.9, businessReady: 40.86, idi: 24.4, corruption: 17.0, urbanization: 25.0, debtToGdp: 13.1 },
  { name: "Niger", rank: 48, score: 46.02, region: "West Africa", strengths: 65.44, opportunities: 10.27, weaknesses: 30.41, threats: 86.15, gdpGrowth: 3.5, businessReady: 40.86, idi: 25.0, corruption: 31.0, urbanization: 18.0, debtToGdp: 46.3 },
  { name: "Mozambique", rank: 49, score: 44.96, region: "Southern Africa", strengths: 58.84, opportunities: 26.75, weaknesses: 21.93, threats: 74.47, gdpGrowth: 4.7, businessReady: 30.0, idi: 32.0, corruption: 21.0, urbanization: 36.0, debtToGdp: 76.9 },
  { name: "Malawi", rank: 50, score: 43.22, region: "Southern Africa", strengths: 62.39, opportunities: 14.79, weaknesses: 30.01, threats: 70.34, gdpGrowth: 1.7, businessReady: 40.86, idi: 33.1, corruption: 34.0, urbanization: 17.0, debtToGdp: 87.7 },
  { name: "Somalia", rank: 51, score: 36.48, region: "East Africa", strengths: 37.97, opportunities: 33.97, weaknesses: 8.82, threats: 65.65, gdpGrowth: 4.1, businessReady: 5.0, idi: 28.7, corruption: 9.0, urbanization: 50.0, debtToGdp: 100.0 },
  { name: "Eritrea", rank: 52, score: 24.72, region: "East Africa", strengths: 41.49, opportunities: 9.20, weaknesses: 6.33, threats: 41.22, gdpGrowth: 2.9, businessReady: 12.0, idi: 15.0, corruption: 13.0, urbanization: 26.0, debtToGdp: 164.0 },
  { name: "South Sudan", rank: 53, score: 22.39, region: "East Africa", strengths: 33.29, opportunities: 2.67, weaknesses: 0.0, threats: 58.02, gdpGrowth: -1.0, businessReady: 10.0, idi: 10.0, corruption: 9.0, urbanization: 21.0, debtToGdp: 120.0 },
  { name: "Sudan", rank: 54, score: 9.36, region: "North Africa", strengths: 7.94, opportunities: 14.56, weaknesses: 13.06, threats: 0.0, gdpGrowth: -18.3, businessReady: 15.0, idi: 14.0, corruption: 14.0, urbanization: 35.0, debtToGdp: 272.0 },
];

export const regions = [
  "North Africa",
  "West Africa",
  "Central Africa",
  "East Africa",
  "Southern Africa",
];

export const regionColors: Record<string, string> = {
  "North Africa": "#ef4444",
  "West Africa": "#f97316",
  "Central Africa": "#eab308",
  "East Africa": "#22c55e",
  "Southern Africa": "#3b82f6",
};

export const getScoreColor = (score: number): string => {
  if (score >= 75) return "#16a34a"; // Green - Excellent
  if (score >= 65) return "#84cc16"; // Lime - Very Good
  if (score >= 55) return "#eab308"; // Yellow - Good
  if (score >= 45) return "#f97316"; // Orange - Fair
  if (score >= 35) return "#ef4444"; // Red - Poor
  return "#7f1d1d"; // Dark Red - Very Poor
};

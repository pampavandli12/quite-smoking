export function parseSmokingSettings(
  cigarettesPerDay: string,
  costPerCigarette: string,
) {
  return {
    cigarettesPerDay: parseInt(cigarettesPerDay, 10),
    costPerCigarette: parseFloat(costPerCigarette),
  };
}

export function areSmokingSettingsValid(
  cigarettesPerDay: string,
  costPerCigarette: string,
) {
  const parsed = parseSmokingSettings(cigarettesPerDay, costPerCigarette);

  return (
    !Number.isNaN(parsed.cigarettesPerDay) &&
    parsed.cigarettesPerDay > 0 &&
    !Number.isNaN(parsed.costPerCigarette) &&
    parsed.costPerCigarette > 0
  );
}

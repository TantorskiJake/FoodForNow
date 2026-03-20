export function mealsForSelectedWeek(mealPlan, selectedWeekStart) {
  if (!Array.isArray(mealPlan) || typeof selectedWeekStart !== 'string' || selectedWeekStart.length < 10) {
    return mealPlan;
  }
  // Compare by UTC date only so timezone doesn't mix this week's and next week's meals
  const selectedKey = selectedWeekStart.slice(0, 10);
  return mealPlan.filter((m) => {
    if (!m?.weekStart) return false;
    const d = new Date(m.weekStart);
    if (Number.isNaN(d.getTime())) return false;
    const weekKey = d.toISOString().slice(0, 10);
    return weekKey === selectedKey;
  });
}

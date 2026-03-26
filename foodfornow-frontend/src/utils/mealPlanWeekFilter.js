function parseDateOnlyUtc(value) {
  const dateOnly = String(value).slice(0, 10);
  const [year, month, day] = dateOnly.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function mealsForSelectedWeek(mealPlan, selectedWeekStart) {
  if (!selectedWeekStart || !Array.isArray(mealPlan)) return mealPlan;

  // Keep week filtering in UTC and by range so changing "week starts on"
  // doesn't hide meals saved with a different canonical weekStart date.
  const start = parseDateOnlyUtc(selectedWeekStart);
  if (!start) return [];
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return mealPlan.filter((m) => {
    if (!m?.weekStart) return false;
    const weekStart = new Date(m.weekStart);
    if (Number.isNaN(weekStart.getTime())) return false;
    return weekStart >= start && weekStart < end;
  });
}

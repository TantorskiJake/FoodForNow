const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getStartOfWeek(date, weekStartsOn) {
  const d = new Date(date);
  const day = d.getDay();
  const daysBack = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - daysBack);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getOrderedDayNames(weekStartsOn) {
  return [...DAY_NAMES.slice(weekStartsOn), ...DAY_NAMES.slice(0, weekStartsOn)];
}

export { DAY_NAMES, getStartOfWeek, getOrderedDayNames };

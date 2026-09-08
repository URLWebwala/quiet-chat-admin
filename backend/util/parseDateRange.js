function parseDateRangeIST(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr || startDateStr === "All" || endDateStr === "All") {
    return null;
  }

  const startStr = String(startDateStr).trim();
  const endStr = String(endDateStr).trim();

  const startMatch = startStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const endMatch = endStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  let startDateObj, endDateObj;

  if (startMatch) {
    startDateObj = new Date(`${startStr}T00:00:00+05:30`);
  } else {
    startDateObj = new Date(startDateStr);
    startDateObj.setHours(0, 0, 0, 0);
  }

  if (endMatch) {
    endDateObj = new Date(`${endStr}T23:59:59.999+05:30`);
  } else {
    endDateObj = new Date(endDateStr);
    endDateObj.setHours(23, 59, 59, 999);
  }

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    return null;
  }

  return { startDateObj, endDateObj };
}

module.exports = parseDateRangeIST;

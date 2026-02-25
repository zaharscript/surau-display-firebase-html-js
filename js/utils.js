/**
 * Formats a date string from YYYY-MM-DD to DD-MM-YYYY
 * @param {string} dateString
 * @returns {string}
 */
export function formatDateDDMMYYYY(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

/**
 * Formats a 24h time string (HH:MM) to 12h format (H:MM)
 * @param {string} time24
 * @returns {string}
 */
export function formatTime12h(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  let hour = parseInt(h);
  // const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${m}`;
}

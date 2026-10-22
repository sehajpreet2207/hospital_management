// Local calendar date as YYYY-MM-DD (toISOString alone would give the UTC date)
const localDate = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

module.exports = { localDate };

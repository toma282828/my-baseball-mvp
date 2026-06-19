/** 東京時間で今日の年を返す */
export function getTodayYear() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
  }).formatToParts(new Date());
  return parseInt(parts.find((p) => p.type === 'year').value, 10);
}

/** 東京時間で今日の日付を YYYY-MM-DD 形式で返す */
export function getTodayString() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
  }).format(new Date());
}

/** YYYY-MM-DD → 表示用 "YYYY年M月D日" */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

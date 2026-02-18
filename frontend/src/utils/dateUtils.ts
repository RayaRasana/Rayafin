// Date utility functions for Persian format YYYY/MM/DD

const pad = (value: number): string => String(value).padStart(2, "0");

const toHtmlDate = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

export const normalizeToHtmlDate = (value: string | Date): string => {
  if (value instanceof Date) {
    return toHtmlDate(value);
  }

  const normalized = value.trim().replace(/\//g, "-");
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return toHtmlDate(parsed);
  }

  return toHtmlDate(new Date());
};

export const formatDateToPersian = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

export const toPersianNumber = (num: number | string): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num)
    .split("")
    .map((digit) => (isNaN(Number(digit)) ? digit : persianDigits[Number(digit)]))
    .join("");
};

export const fromPersianNumber = (text: string): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const englishDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  let result = text;
  for (let i = 0; i < 10; i++) {
    const regex = new RegExp(persianDigits[i], "g");
    result = result.replace(regex, englishDigits[i]);
  }
  return result;
};

export const formatCurrencyPersian = (amount: number): string => {
  return toPersianNumber(amount.toLocaleString("fa-IR"));
};

export const today = (): string => {
  return toHtmlDate(new Date());
};

export const addDays = (date: string, days: number): string => {
  const d = new Date(normalizeToHtmlDate(date));
  d.setDate(d.getDate() + days);
  return toHtmlDate(d);
};

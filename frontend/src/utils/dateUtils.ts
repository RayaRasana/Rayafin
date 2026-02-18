// Date utility functions for Persian format YYYY/MM/DD

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
  return formatDateToPersian(new Date());
};

export const addDays = (date: string, days: number): string => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return formatDateToPersian(d);
};

/**
 * Persian/Farsi Number Utilities
 * Converts English digits to Persian digits and formats currency
 */

/**
 * Convert English digits to Persian digits
 */
export const toPersianDigits = (input: number | string | null | undefined): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const str = String(input ?? '');
  
  return str.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

/**
 * Format number with thousand separators and convert to Persian
 */
export const formatPersianNumber = (num: number | null | undefined): string => {
  // Handle null/undefined values
  const safeNum = num ?? 0;
  
  // Format with thousand separators
  const formatted = safeNum.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  // Convert to Persian digits
  return toPersianDigits(formatted);
};

/**
 * Format currency in Persian with Rial/Toman
 */
export const formatPersianCurrency = (
  amount: number | null | undefined,
  unit: 'ریال' | 'تومان' = 'ریال',
  showUnit: boolean = true
): string => {
  const formatted = formatPersianNumber(amount);
  return showUnit ? `${formatted} ${unit}` : formatted;
};

/**
 * Convert English text to Persian numbers
 */
export const convertToPersianNumbers = (text: string): string => {
  return toPersianDigits(text);
};

/**
 * Format date in Persian
 */
export const formatPersianDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return toPersianDigits(`${year}/${month}/${day}`);
};

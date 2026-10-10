/**
 * GST Invoice Pro - Utility Functions
 * Indian Number to Words, Currency Formatting, GSTIN Validation, State Codes
 */

// Official 36 Indian States and Union Territories with 2-digit GST State Codes
export const INDIAN_STATES = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' }
];

/**
 * Format a number as Indian Currency (e.g. ₹ 1,18,000.00)
 * Uses Indian numbering system: Crores, Lakhs, Thousands
 */
export function formatINR(amount, includeSymbol = true) {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  const parts = absNum.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian comma formatting: last 3 digits, then groups of 2
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const formatted = (isNegative ? '-' : '') + formattedInteger + '.' + decimalPart;

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Standard rounding to 2 decimal places with precision protection
 */
export function roundTo2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Validates standard 15-character Indian GSTIN
 * Format: 2 digits (state) + 5 uppercase letters (PAN) + 4 digits (PAN) + 1 letter (PAN) + 1 digit/char + 'Z' + 1 checksum
 */
export function validateGSTIN(gstin) {
  if (!gstin) return { valid: false, message: 'GSTIN is required' };
  const cleaned = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (cleaned.length !== 15) {
    return { valid: false, message: 'GSTIN must be exactly 15 characters' };
  }
  if (!regex.test(cleaned)) {
    return { valid: false, message: 'Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)' };
  }
  
  const stateCode = cleaned.substring(0, 2);
  const state = INDIAN_STATES.find(s => s.code === stateCode);
  return { 
    valid: true, 
    cleaned,
    stateCode, 
    stateName: state ? state.name : 'Unknown State',
    pan: cleaned.substring(2, 12)
  };
}

/**
 * Extract state code from GSTIN if valid, or return null
 */
export function getStateFromGSTIN(gstin) {
  if (!gstin || gstin.length < 2) return null;
  const code = gstin.trim().substring(0, 2);
  return INDIAN_STATES.find(s => s.code === code) || null;
}

/**
 * Convert number to words in Indian numbering system (Lakhs, Crores, Rupees, Paise)
 * Example: 11800 -> "Rupees Eleven Thousand Eight Hundred Only"
 * Example: 10450.50 -> "Rupees Ten Thousand Four Hundred Fifty and Fifty Paise Only"
 */
export function numberToWordsINR(amount) {
  const num = roundTo2(amount);
  if (isNaN(num) || num === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n === 0) return '';
    if (n < 10) return singleDigits[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
    }
    if (rest > 0) {
      if (res !== '') res += ' ';
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const parts = num.toFixed(2).split('.');
  let rupees = parseInt(parts[0], 10);
  const paise = parseInt(parts[1], 10);

  let rupeesWords = '';

  if (rupees === 0) {
    rupeesWords = 'Zero';
  } else {
    // Crores (10,000,000)
    const crores = Math.floor(rupees / 10000000);
    rupees %= 10000000;

    // Lakhs (100,000)
    const lakhs = Math.floor(rupees / 100000);
    rupees %= 100000;

    // Thousands (1,000)
    const thousands = Math.floor(rupees / 1000);
    rupees %= 1000;

    // Hundreds and below
    const hundreds = rupees;

    const words = [];
    if (crores > 0) words.push(convertThreeDigits(crores) + ' Crore');
    if (lakhs > 0) words.push(convertTwoDigits(lakhs) + ' Lakh');
    if (thousands > 0) words.push(convertTwoDigits(thousands) + ' Thousand');
    if (hundreds > 0) words.push(convertThreeDigits(hundreds));

    rupeesWords = words.join(' ');
  }

  let finalWords = `Rupees ${rupeesWords}`;

  if (paise > 0) {
    const paiseWords = convertTwoDigits(paise);
    finalWords += ` and ${paiseWords} Paise`;
  }

  finalWords += ' Only';
  return finalWords.trim();
}

/**
 * Format date as DD/MM/YYYY
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date for input[type="date"] (YYYY-MM-DD)
 */
export function toInputDate(d = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
}

/**
 * Add days to a date string or object
 */
export function addDays(dateString, days) {
  const d = new Date(dateString);
  d.setDate(d.getDate() + Number(days));
  return toInputDate(d);
}

/**
 * Generate a random UUID
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Sanitize text to avoid HTML injection
 */
export function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

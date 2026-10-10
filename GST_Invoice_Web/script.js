/**
 * GST Invoice Pro - Production Application Bundle
 * Pure standalone ES6 implementation compatible with direct file:/// execution and standard HTTP servers.
 */

// ============================================================================
// 1. UTILITY FUNCTIONS & CONSTANTS
// ============================================================================

const INDIAN_STATES = [
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

function formatINR(amount, includeSymbol = true) {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  const parts = absNum.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const formatted = (isNegative ? '-' : '') + formattedInteger + '.' + decimalPart;

  return includeSymbol ? `₹${formatted}` : formatted;
}

function roundTo2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

function validateGSTIN(gstin) {
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

function getStateFromGSTIN(gstin) {
  if (!gstin || gstin.length < 2) return null;
  const code = gstin.trim().substring(0, 2);
  return INDIAN_STATES.find(s => s.code === code) || null;
}

function numberToWordsINR(amount) {
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
    const crores = Math.floor(rupees / 10000000);
    rupees %= 10000000;

    const lakhs = Math.floor(rupees / 100000);
    rupees %= 100000;

    const thousands = Math.floor(rupees / 1000);
    rupees %= 1000;

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

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function toInputDate(d = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
}

function addDays(dateString, days) {
  const d = new Date(dateString);
  d.setDate(d.getDate() + Number(days));
  return toInputDate(d);
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// 2. GST CALCULATOR MODULE
// ============================================================================

class GSTCalculator {
  constructor(app) {
    this.app = app;
    this.state = {
      amount: 10000,
      rate: 18,
      isCustomRate: false,
      calculationType: 'exclusive',
      supplyType: 'intra'
    };
  }

  static calculate({ amount, rate, calculationType, supplyType }) {
    const rawAmount = Math.max(0, Number(amount) || 0);
    const gstRate = Math.max(0, Number(rate) || 0);
    
    let taxableAmount = 0;
    let totalGST = 0;
    let grandTotal = 0;

    if (calculationType === 'exclusive') {
      taxableAmount = roundTo2(rawAmount);
      totalGST = roundTo2(taxableAmount * (gstRate / 100));
      grandTotal = roundTo2(taxableAmount + totalGST);
    } else {
      grandTotal = roundTo2(rawAmount);
      taxableAmount = roundTo2(grandTotal / (1 + gstRate / 100));
      totalGST = roundTo2(grandTotal - taxableAmount);
    }

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (supplyType === 'intra') {
      cgst = roundTo2(totalGST / 2);
      sgst = roundTo2(totalGST - cgst);
      igst = 0;
    } else {
      cgst = 0;
      sgst = 0;
      igst = totalGST;
    }

    return {
      rawAmount,
      rate: gstRate,
      calculationType,
      supplyType,
      taxableAmount,
      totalGST,
      grandTotal,
      cgst,
      sgst,
      igst,
      cgstRate: supplyType === 'intra' ? gstRate / 2 : 0,
      sgstRate: supplyType === 'intra' ? gstRate / 2 : 0,
      igstRate: supplyType === 'inter' ? gstRate : 0
    };
  }

  init() {
    this.amountInput = document.getElementById('calc-amount');
    this.calcTypeInputs = document.querySelectorAll('input[name="calc-type"]');
    this.supplyTypeInputs = document.querySelectorAll('input[name="calc-supply-type"]');
    this.rateButtons = document.querySelectorAll('.calc-rate-btn');
    this.customRateContainer = document.getElementById('calc-custom-rate-container');
    this.customRateInput = document.getElementById('calc-custom-rate');
    this.createInvoiceBtn = document.getElementById('calc-create-invoice-btn');
    this.copyBreakdownBtn = document.getElementById('calc-copy-btn');

    if (!this.amountInput) return;

    this.amountInput.addEventListener('input', (e) => {
      this.state.amount = parseFloat(e.target.value) || 0;
      this.render();
    });

    this.calcTypeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.state.calculationType = e.target.value;
          this.render();
        }
      });
    });

    this.supplyTypeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.state.supplyType = e.target.value;
          this.render();
        }
      });
    });

    this.rateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const rate = btn.dataset.rate;
        if (rate === 'custom') {
          this.state.isCustomRate = true;
          this.customRateContainer.classList.remove('hidden');
          this.state.rate = parseFloat(this.customRateInput.value) || 0;
        } else {
          this.state.isCustomRate = false;
          this.customRateContainer.classList.add('hidden');
          this.state.rate = parseFloat(rate);
        }
        this.updateRateButtonsUI();
        this.render();
      });
    });

    if (this.customRateInput) {
      this.customRateInput.addEventListener('input', (e) => {
        if (this.state.isCustomRate) {
          this.state.rate = parseFloat(e.target.value) || 0;
          this.render();
        }
      });
    }

    if (this.createInvoiceBtn) {
      this.createInvoiceBtn.addEventListener('click', () => {
        const result = GSTCalculator.calculate(this.state);
        this.app.createNewInvoiceFromCalculator({
          taxableAmount: result.taxableAmount,
          gstRate: result.rate,
          supplyType: result.supplyType,
          totalGST: result.totalGST,
          grandTotal: result.grandTotal
        });
      });
    }

    if (this.copyBreakdownBtn) {
      this.copyBreakdownBtn.addEventListener('click', () => {
        this.copyBreakdownText();
      });
    }

    this.updateRateButtonsUI();
    this.render();
  }

  updateRateButtonsUI() {
    this.rateButtons.forEach(btn => {
      const isCustom = btn.dataset.rate === 'custom';
      const isSelected = (!isCustom && !this.state.isCustomRate && parseFloat(btn.dataset.rate) === this.state.rate) ||
                         (isCustom && this.state.isCustomRate);
      
      if (isSelected) {
        btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600', 'shadow-sm');
        btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200', 'hover:bg-slate-50');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600', 'shadow-sm');
        btn.classList.add('bg-white', 'text-slate-700', 'border-slate-200', 'hover:bg-slate-50');
      }
    });
  }

  render() {
    const result = GSTCalculator.calculate(this.state);

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText('calc-taxable-display', formatINR(result.taxableAmount));
    setText('calc-total-gst-display', formatINR(result.totalGST));
    setText('calc-grand-total-display', formatINR(result.grandTotal));
    setText('calc-rate-badge', `${result.rate}%`);

    const intraContainer = document.getElementById('calc-intra-breakdown');
    const interContainer = document.getElementById('calc-inter-breakdown');

    if (result.supplyType === 'intra') {
      if (intraContainer) intraContainer.classList.remove('hidden');
      if (interContainer) interContainer.classList.add('hidden');
      setText('calc-cgst-rate', `(${result.cgstRate}%)`);
      setText('calc-cgst-amount', formatINR(result.cgst));
      setText('calc-sgst-rate', `(${result.sgstRate}%)`);
      setText('calc-sgst-amount', formatINR(result.sgst));
    } else {
      if (intraContainer) intraContainer.classList.add('hidden');
      if (interContainer) interContainer.classList.remove('hidden');
      setText('calc-igst-rate', `(${result.igstRate}%)`);
      setText('calc-igst-amount', formatINR(result.igst));
    }

    const formulaEl = document.getElementById('calc-formula-text');
    if (formulaEl) {
      if (result.calculationType === 'exclusive') {
        formulaEl.innerHTML = `GST = Taxable Base (₹${result.taxableAmount.toLocaleString('en-IN')}) × ${result.rate}% = <strong class="text-blue-700">₹${result.totalGST.toLocaleString('en-IN')}</strong>.<br/>Grand Total = Taxable Base + GST = <strong class="text-slate-900">₹${result.grandTotal.toLocaleString('en-IN')}</strong>.`;
      } else {
        formulaEl.innerHTML = `Taxable Base = Total (₹${result.grandTotal.toLocaleString('en-IN')}) ÷ (1 + ${result.rate} ÷ 100) = <strong class="text-blue-700">₹${result.taxableAmount.toLocaleString('en-IN')}</strong>.<br/>GST = Total - Taxable Base = <strong class="text-slate-900">₹${result.totalGST.toLocaleString('en-IN')}</strong>.`;
      }
    }

    this.renderComparisonTable(result.rawAmount, result.calculationType, result.supplyType);
  }

  renderComparisonTable(amount, calculationType, supplyType) {
    const tableBody = document.getElementById('calc-comparison-body');
    if (!tableBody) return;

    const rates = [0, 5, 12, 18, 28];
    tableBody.innerHTML = rates.map(r => {
      const res = GSTCalculator.calculate({
        amount,
        rate: r,
        calculationType,
        supplyType
      });
      const isCurrent = r === this.state.rate && !this.state.isCustomRate;
      return `
        <tr class="border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${isCurrent ? 'bg-blue-50 font-semibold' : ''}">
          <td class="py-2.5 px-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}">
              ${r}% GST
            </span>
          </td>
          <td class="py-2.5 px-3 text-right text-slate-700">${formatINR(res.taxableAmount)}</td>
          <td class="py-2.5 px-3 text-right text-blue-600">${formatINR(res.totalGST)}</td>
          <td class="py-2.5 px-3 text-right text-slate-900 font-bold">${formatINR(res.grandTotal)}</td>
        </tr>
      `;
    }).join('');
  }

  copyBreakdownText() {
    const res = GSTCalculator.calculate(this.state);
    const taxType = res.supplyType === 'intra'
      ? `CGST (${res.cgstRate}%): ${formatINR(res.cgst)}\nSGST (${res.sgstRate}%): ${formatINR(res.sgst)}`
      : `IGST (${res.igstRate}%): ${formatINR(res.igst)}`;

    const text = `--- GST Invoice Pro Calculation ---
Type: ${res.calculationType.toUpperCase()} GST (${res.rate}%)
Supply: ${res.supplyType === 'intra' ? 'Intra-State' : 'Inter-State'}
Taxable Value: ${formatINR(res.taxableAmount)}
${taxType}
Total GST: ${formatINR(res.totalGST)}
Grand Total: ${formatINR(res.grandTotal)}
------------------------------------`;

    navigator.clipboard.writeText(text).then(() => {
      this.app.showToast('Calculation breakdown copied to clipboard!', 'success');
    }).catch(() => {
      this.app.showToast('Failed to copy to clipboard', 'error');
    });
  }
}

// ============================================================================
// 3. CUSTOMER MANAGEMENT MODULE
// ============================================================================

class CustomerManager {
  constructor(app) {
    this.app = app;
    this.storageKey = 'gst_invoice_customers';
    this.customers = this.loadCustomers();
  }

  loadCustomers() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error loading customers from localStorage', e);
    }
    return this.getDefaultCustomers();
  }

  saveCustomers() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.customers));
    } catch (e) {
      console.error('Error saving customers to localStorage', e);
    }
  }

  getDefaultCustomers() {
    return [
      {
        id: 'cust-1',
        name: 'Rahul Sharma',
        businessName: 'Sharma Infotech Solutions',
        gstin: '29ABCDE1234F1Z5',
        email: 'billing@sharmainfotech.in',
        phone: '+91 98450 12345',
        address: '42, 100 Feet Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        stateCode: '29',
        pincode: '560038',
        createdAt: '2026-03-01T10:00:00Z'
      },
      {
        id: 'cust-2',
        name: 'Priya Patel',
        businessName: 'Patel Electronics & Logistics',
        gstin: '27AABCP8765Q1Z2',
        email: 'accounts@patelelec.com',
        phone: '+91 98200 54321',
        address: '15 Nariman Point, Express Towers',
        city: 'Mumbai',
        state: 'Maharashtra',
        stateCode: '27',
        pincode: '400021',
        createdAt: '2026-03-05T14:30:00Z'
      },
      {
        id: 'cust-3',
        name: 'Amit Verma',
        businessName: 'Verma Digital Media',
        gstin: '07AAACV9012K1Z8',
        email: 'amit@vermadigital.org',
        phone: '+91 99100 87654',
        address: '88 Barakhamba Road, Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        stateCode: '07',
        pincode: '110001',
        createdAt: '2026-03-10T09:15:00Z'
      }
    ];
  }

  getAll() {
    return this.customers;
  }

  getById(id) {
    return this.customers.find(c => c.id === id);
  }

  add(customerData) {
    const newCustomer = {
      id: generateUUID(),
      name: customerData.name.trim(),
      businessName: (customerData.businessName || '').trim(),
      gstin: (customerData.gstin || '').trim().toUpperCase(),
      email: (customerData.email || '').trim(),
      phone: (customerData.phone || '').trim(),
      address: (customerData.address || '').trim(),
      city: (customerData.city || '').trim(),
      state: customerData.state || '',
      stateCode: customerData.stateCode || '',
      pincode: (customerData.pincode || '').trim(),
      createdAt: new Date().toISOString()
    };

    this.customers.unshift(newCustomer);
    this.saveCustomers();
    this.render();
    return newCustomer;
  }

  update(id, customerData) {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.customers[index] = {
      ...this.customers[index],
      name: customerData.name.trim(),
      businessName: (customerData.businessName || '').trim(),
      gstin: (customerData.gstin || '').trim().toUpperCase(),
      email: (customerData.email || '').trim(),
      phone: (customerData.phone || '').trim(),
      address: (customerData.address || '').trim(),
      city: (customerData.city || '').trim(),
      state: customerData.state || '',
      stateCode: customerData.stateCode || '',
      pincode: (customerData.pincode || '').trim(),
      updatedAt: new Date().toISOString()
    };

    this.saveCustomers();
    this.render();
    return this.customers[index];
  }

  delete(id) {
    this.customers = this.customers.filter(c => c.id !== id);
    this.saveCustomers();
    this.render();
  }

  init() {
    this.container = document.getElementById('customers-list');
    this.searchInput = document.getElementById('customers-search');
    this.addBtn = document.getElementById('add-customer-btn');
    this.modal = document.getElementById('customer-modal');
    this.form = document.getElementById('customer-form');
    this.modalTitle = document.getElementById('customer-modal-title');
    this.cancelBtn = document.getElementById('customer-modal-cancel');
    this.editingId = null;

    if (!this.container) return;

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.render(e.target.value);
      });
    }

    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => {
        this.openModal();
      });
    }

    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    const gstinInput = document.getElementById('modal-cust-gstin');
    const stateSelect = document.getElementById('modal-cust-state');
    if (gstinInput && stateSelect) {
      gstinInput.addEventListener('input', (e) => {
        const val = e.target.value.trim().toUpperCase();
        if (val.length >= 2) {
          const stateCode = val.substring(0, 2);
          const matched = INDIAN_STATES.find(s => s.code === stateCode);
          if (matched) {
            stateSelect.value = matched.name;
          }
        }
      });
    }

    this.populateStateSelects();
    this.render();
  }

  populateStateSelects() {
    const stateSelect = document.getElementById('modal-cust-state');
    if (stateSelect && stateSelect.children.length <= 1) {
      INDIAN_STATES.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = `${s.name} (${s.code})`;
        opt.dataset.code = s.code;
        stateSelect.appendChild(opt);
      });
    }
  }

  openModal(customer = null) {
    if (!this.modal) return;
    this.editingId = customer ? customer.id : null;
    this.modalTitle.textContent = customer ? 'Edit Customer' : 'Add New Customer';

    document.getElementById('modal-cust-name').value = customer ? customer.name : '';
    document.getElementById('modal-cust-business').value = customer ? customer.businessName : '';
    document.getElementById('modal-cust-gstin').value = customer ? customer.gstin : '';
    document.getElementById('modal-cust-email').value = customer ? customer.email : '';
    document.getElementById('modal-cust-phone').value = customer ? customer.phone : '';
    document.getElementById('modal-cust-address').value = customer ? customer.address : '';
    document.getElementById('modal-cust-city').value = customer ? customer.city : '';
    document.getElementById('modal-cust-state').value = customer ? customer.state : '';
    document.getElementById('modal-cust-pincode').value = customer ? customer.pincode : '';

    this.modal.classList.remove('hidden');
    document.getElementById('modal-cust-name').focus();
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    this.form.reset();
    this.editingId = null;
  }

  handleFormSubmit() {
    const name = document.getElementById('modal-cust-name').value.trim();
    if (!name) {
      this.app.showToast('Customer Name is required', 'error');
      return;
    }

    const gstin = document.getElementById('modal-cust-gstin').value.trim().toUpperCase();
    if (gstin) {
      const gstinVal = validateGSTIN(gstin);
      if (!gstinVal.valid) {
        this.app.showToast(gstinVal.message, 'warning');
      }
    }

    const stateSelect = document.getElementById('modal-cust-state');
    const selectedOption = stateSelect.options[stateSelect.selectedIndex];
    const state = stateSelect.value;
    const stateCode = selectedOption && selectedOption.dataset.code ? selectedOption.dataset.code : '';

    const data = {
      name,
      businessName: document.getElementById('modal-cust-business').value,
      gstin,
      email: document.getElementById('modal-cust-email').value,
      phone: document.getElementById('modal-cust-phone').value,
      address: document.getElementById('modal-cust-address').value,
      city: document.getElementById('modal-cust-city').value,
      state,
      stateCode,
      pincode: document.getElementById('modal-cust-pincode').value
    };

    if (this.editingId) {
      this.update(this.editingId, data);
      this.app.showToast('Customer updated successfully', 'success');
    } else {
      this.add(data);
      this.app.showToast('Customer created successfully', 'success');
    }

    this.closeModal();
    this.app.populateCustomerDropdowns();
  }

  render(searchTerm = '') {
    if (!this.container) return;
    const query = searchTerm.toLowerCase().trim();
    const filtered = this.customers.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.businessName && c.businessName.toLowerCase().includes(query)) ||
      (c.gstin && c.gstin.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(query)) ||
      (c.city && c.city.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div class="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="users" class="w-8 h-8"></i>
          </div>
          <h3 class="text-base font-semibold text-slate-900 mb-1">No customers found</h3>
          <p class="text-xs text-slate-500 mb-4">Add your frequent clients to quickly generate invoices with one click.</p>
          <button type="button" class="btn-primary inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700" onclick="window.gstApp.customers.openModal()">
            <i data-lucide="user-plus" class="w-4 h-4 mr-2"></i> Add Customer
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    this.container.innerHTML = filtered.map(c => `
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                ${escapeHTML(c.name.charAt(0).toUpperCase())}
              </div>
              <div>
                <h4 class="font-semibold text-slate-900 text-sm leading-tight">${escapeHTML(c.name)}</h4>
                ${c.businessName ? `<p class="text-xs text-slate-500 font-medium">${escapeHTML(c.businessName)}</p>` : ''}
              </div>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${c.gstin ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}">
              ${c.gstin ? 'GST Registered' : 'Unregistered'}
            </span>
          </div>

          <div class="space-y-1.5 text-xs text-slate-600 mb-4 border-t border-slate-100 pt-3">
            ${c.gstin ? `<div class="flex items-center"><span class="font-mono text-slate-800 font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">${escapeHTML(c.gstin)}</span></div>` : ''}
            ${c.phone ? `<div class="flex items-center space-x-2"><i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400"></i><span>${escapeHTML(c.phone)}</span></div>` : ''}
            ${c.email ? `<div class="flex items-center space-x-2"><i data-lucide="mail" class="w-3.5 h-3.5 text-slate-400"></i><span class="truncate">${escapeHTML(c.email)}</span></div>` : ''}
            ${(c.city || c.state) ? `<div class="flex items-center space-x-2"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i><span>${escapeHTML([c.city, c.state].filter(Boolean).join(', '))}</span></div>` : ''}
          </div>
        </div>

        <div class="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
          <button type="button" class="btn-create-invoice-for-cust inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800" data-id="${c.id}">
            <i data-lucide="file-plus" class="w-3.5 h-3.5 mr-1"></i> New Invoice
          </button>
          <div class="flex items-center space-x-2">
            <button type="button" class="btn-edit-cust p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100" data-id="${c.id}" title="Edit Customer">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" class="btn-delete-cust p-1.5 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50" data-id="${c.id}" title="Delete Customer">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    this.container.querySelectorAll('.btn-create-invoice-for-cust').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const customer = this.getById(id);
        if (customer) {
          this.app.createNewInvoiceForCustomer(customer);
        }
      });
    });

    this.container.querySelectorAll('.btn-edit-cust').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const customer = this.getById(id);
        if (customer) {
          this.openModal(customer);
        }
      });
    });

    this.container.querySelectorAll('.btn-delete-cust').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Are you sure you want to delete this customer?')) {
          this.delete(id);
          this.app.showToast('Customer deleted', 'info');
          this.app.populateCustomerDropdowns();
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }
}

// ============================================================================
// 4. SETTINGS MODULE
// ============================================================================

class SettingsManager {
  constructor(app) {
    this.app = app;
    this.storageKey = 'gst_invoice_settings';
    this.settings = this.loadSettings();
  }

  loadSettings() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        return { ...this.getDefaultSettings(), ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Error loading settings from localStorage', e);
    }
    return this.getDefaultSettings();
  }

  getDefaultSettings() {
    return {
      businessName: 'Apex Infotech Solutions Pvt Ltd',
      tradeName: 'Apex Cloud & Dev',
      gstin: '29AABCA1234F1Z1',
      pan: 'AABCA1234F',
      phone: '+91 80 4123 4567',
      email: 'billing@apexinfotech.in',
      address: '7th Floor, Brigade Tech Park, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560066',
      logoUrl: '',

      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200012345678',
      accountHolder: 'Apex Infotech Solutions Pvt Ltd',
      ifscCode: 'HDFC0000128',
      branch: 'Whitefield Branch, Bangalore',
      upiId: 'apexinfotech@okhdfcbank',

      invoicePrefix: 'INV-2026-',
      nextInvoiceNumber: 1004,
      defaultGstRate: 18,
      defaultDueDays: 15,
      defaultPaymentTerms: 'Payment is due within 15 days of invoice date. Late payments may attract interest @ 18% p.a.',
      defaultNotes: 'Thank you for your business! Please quote invoice number for all payments.',
      declaration: 'We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.'
    };
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Error saving settings to localStorage', e);
    }
  }

  get() {
    return this.settings;
  }

  update(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.save();
    return this.settings;
  }

  getNextInvoiceNumber() {
    const num = this.settings.nextInvoiceNumber || 1001;
    const prefix = this.settings.invoicePrefix || 'INV-2026-';
    return `${prefix}${String(num).padStart(4, '0')}`;
  }

  incrementInvoiceNumber() {
    this.settings.nextInvoiceNumber = (this.settings.nextInvoiceNumber || 1000) + 1;
    this.save();
  }

  init() {
    this.form = document.getElementById('settings-form');
    this.logoInput = document.getElementById('settings-logo-input');
    this.logoPreview = document.getElementById('settings-logo-preview');
    this.removeLogoBtn = document.getElementById('settings-remove-logo');
    this.exportBtn = document.getElementById('settings-export-data');
    this.importInput = document.getElementById('settings-import-file');
    this.resetDemoBtn = document.getElementById('settings-reset-demo');

    this.populateStates();
    this.populateFormFields();

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    if (this.logoInput) {
      this.logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            this.app.showToast('Logo image must be under 2MB', 'error');
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            this.settings.logoUrl = event.target.result;
            this.updateLogoPreview();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (this.removeLogoBtn) {
      this.removeLogoBtn.addEventListener('click', () => {
        this.settings.logoUrl = '';
        if (this.logoInput) this.logoInput.value = '';
        this.updateLogoPreview();
      });
    }

    const gstinInput = document.getElementById('set-gstin');
    const stateSelect = document.getElementById('set-state');
    const panInput = document.getElementById('set-pan');
    if (gstinInput) {
      gstinInput.addEventListener('input', (e) => {
        const val = e.target.value.trim().toUpperCase();
        if (val.length >= 2) {
          const stateCode = val.substring(0, 2);
          const matched = INDIAN_STATES.find(s => s.code === stateCode);
          if (matched && stateSelect) {
            stateSelect.value = matched.name;
          }
        }
        if (val.length >= 12 && panInput && !panInput.value) {
          panInput.value = val.substring(2, 12);
        }
      });
    }

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => {
        this.exportAllData();
      });
    }

    if (this.importInput) {
      this.importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.importAllData(file);
        }
      });
    }

    if (this.resetDemoBtn) {
      this.resetDemoBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all data to default demo data? Your current invoices and custom settings will be restored.')) {
          this.app.resetToDemoData();
        }
      });
    }
  }

  populateStates() {
    const stateSelect = document.getElementById('set-state');
    if (stateSelect && stateSelect.children.length <= 1) {
      INDIAN_STATES.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = `${s.name} (${s.code})`;
        opt.dataset.code = s.code;
        stateSelect.appendChild(opt);
      });
    }
  }

  populateFormFields() {
    const s = this.settings;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('set-business-name', s.businessName);
    setVal('set-trade-name', s.tradeName);
    setVal('set-gstin', s.gstin);
    setVal('set-pan', s.pan);
    setVal('set-phone', s.phone);
    setVal('set-email', s.email);
    setVal('set-address', s.address);
    setVal('set-city', s.city);
    setVal('set-state', s.state);
    setVal('set-pincode', s.pincode);

    setVal('set-bank-name', s.bankName);
    setVal('set-account-number', s.accountNumber);
    setVal('set-account-holder', s.accountHolder);
    setVal('set-ifsc', s.ifscCode);
    setVal('set-branch', s.branch);
    setVal('set-upi-id', s.upiId);

    setVal('set-invoice-prefix', s.invoicePrefix);
    setVal('set-next-number', s.nextInvoiceNumber);
    setVal('set-default-gst-rate', s.defaultGstRate);
    setVal('set-default-due-days', s.defaultDueDays);
    setVal('set-terms', s.defaultPaymentTerms);
    setVal('set-notes', s.defaultNotes);

    this.updateLogoPreview();
  }

  updateLogoPreview() {
    if (!this.logoPreview) return;
    if (this.settings.logoUrl) {
      this.logoPreview.src = this.settings.logoUrl;
      this.logoPreview.classList.remove('hidden');
      if (this.removeLogoBtn) this.removeLogoBtn.classList.remove('hidden');
    } else {
      this.logoPreview.src = '';
      this.logoPreview.classList.add('hidden');
      if (this.removeLogoBtn) this.removeLogoBtn.classList.add('hidden');
    }
  }

  handleFormSubmit() {
    const stateSelect = document.getElementById('set-state');
    const selectedOption = stateSelect ? stateSelect.options[stateSelect.selectedIndex] : null;
    const stateCode = selectedOption && selectedOption.dataset.code ? selectedOption.dataset.code : '29';

    const gstin = document.getElementById('set-gstin').value.trim().toUpperCase();
    if (gstin) {
      const gVal = validateGSTIN(gstin);
      if (!gVal.valid) {
        this.app.showToast(gVal.message, 'warning');
      }
    }

    const updated = {
      businessName: document.getElementById('set-business-name').value.trim(),
      tradeName: document.getElementById('set-trade-name').value.trim(),
      gstin,
      pan: document.getElementById('set-pan').value.trim().toUpperCase(),
      phone: document.getElementById('set-phone').value.trim(),
      email: document.getElementById('set-email').value.trim(),
      address: document.getElementById('set-address').value.trim(),
      city: document.getElementById('set-city').value.trim(),
      state: stateSelect ? stateSelect.value : '',
      stateCode,
      pincode: document.getElementById('set-pincode').value.trim(),

      bankName: document.getElementById('set-bank-name').value.trim(),
      accountNumber: document.getElementById('set-account-number').value.trim(),
      accountHolder: document.getElementById('set-account-holder').value.trim(),
      ifscCode: document.getElementById('set-ifsc').value.trim().toUpperCase(),
      branch: document.getElementById('set-branch').value.trim(),
      upiId: document.getElementById('set-upi-id').value.trim(),

      invoicePrefix: document.getElementById('set-invoice-prefix').value.trim() || 'INV-',
      nextInvoiceNumber: parseInt(document.getElementById('set-next-number').value, 10) || 1001,
      defaultGstRate: parseFloat(document.getElementById('set-default-gst-rate').value) || 18,
      defaultDueDays: parseInt(document.getElementById('set-default-due-days').value, 10) || 15,
      defaultPaymentTerms: document.getElementById('set-terms').value.trim(),
      defaultNotes: document.getElementById('set-notes').value.trim()
    };

    this.update(updated);
    this.app.showToast('Settings saved successfully', 'success');
  }

  exportAllData() {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.settings,
      customers: this.app.customers ? this.app.customers.getAll() : [],
      invoices: this.app.invoices ? this.app.invoices.getAll() : []
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST_Invoice_Pro_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.app.showToast('Backup data downloaded', 'success');
  }

  importAllData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.settings) {
          localStorage.setItem('gst_invoice_settings', JSON.stringify(data.settings));
        }
        if (data.customers) {
          localStorage.setItem('gst_invoice_customers', JSON.stringify(data.customers));
        }
        if (data.invoices) {
          localStorage.setItem('gst_invoice_invoices', JSON.stringify(data.invoices));
        }
        this.app.showToast('Data imported successfully! Reloading...', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        console.error('Import error', err);
        this.app.showToast('Invalid backup JSON file', 'error');
      }
    };
    reader.readAsText(file);
  }
}

// ============================================================================
// 5. INVOICE MODEL & MANAGER MODULE
// ============================================================================

class InvoiceManager {
  constructor(app) {
    this.app = app;
    this.storageKey = 'gst_invoice_invoices';
    this.invoices = this.loadInvoices();
    this.currentInvoice = this.createNewInvoiceState();
    this.editingInvoiceId = null;
  }

  loadInvoices() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error loading invoices from localStorage', e);
    }
    return this.getDefaultInvoices();
  }

  saveInvoices() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.invoices));
    } catch (e) {
      console.error('Error saving invoices to localStorage', e);
    }
  }

  getDefaultInvoices() {
    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(d1.getDate() - 3);
    const d2 = new Date(today);
    d2.setDate(d2.getDate() - 8);
    const d3 = new Date(today);
    d3.setDate(d3.getDate() - 15);

    return [
      {
        id: 'inv-1001',
        invoiceNumber: 'INV-2026-1001',
        invoiceDate: toInputDate(d1),
        dueDate: toInputDate(addDays(d1, 15)),
        status: 'paid',
        supplyType: 'intra',
        placeOfSupply: 'Karnataka',
        placeOfSupplyCode: '29',
        reverseCharge: 'No',
        customer: {
          id: 'cust-1',
          name: 'Rahul Sharma',
          businessName: 'Sharma Infotech Solutions',
          gstin: '29ABCDE1234F1Z5',
          email: 'billing@sharmainfotech.in',
          phone: '+91 98450 12345',
          address: '42, 100 Feet Road, Indiranagar, Bengaluru',
          state: 'Karnataka',
          stateCode: '29'
        },
        items: [
          {
            id: 'item-1',
            name: 'Cloud Infrastructure & DevOps Consulting',
            hsn: '998314',
            qty: 1,
            unit: 'Month',
            rate: 75000,
            discount: 5000,
            discountType: 'flat',
            taxableAmount: 70000,
            gstRate: 18,
            gstAmount: 12600,
            total: 82600
          },
          {
            id: 'item-2',
            name: 'Security Audit & Vulnerability Assessment',
            hsn: '998316',
            qty: 1,
            unit: 'Service',
            rate: 25000,
            discount: 0,
            discountType: 'flat',
            taxableAmount: 25000,
            gstRate: 18,
            gstAmount: 4500,
            total: 29500
          }
        ],
        subtotal: 100000,
        totalDiscount: 5000,
        taxableValue: 95000,
        cgst: 8550,
        sgst: 8550,
        igst: 0,
        totalGST: 17100,
        roundOff: 0.00,
        grandTotal: 112100,
        amountInWords: 'Rupees One Lakh Twelve Thousand One Hundred Only',
        paymentMethod: 'Bank Transfer',
        paymentTerms: 'Payment due within 15 days of invoice date.',
        notes: 'Thank you for choosing Apex Infotech. We appreciate your partnership!',
        createdAt: d1.toISOString()
      },
      {
        id: 'inv-1002',
        invoiceNumber: 'INV-2026-1002',
        invoiceDate: toInputDate(d2),
        dueDate: toInputDate(addDays(d2, 15)),
        status: 'pending',
        supplyType: 'inter',
        placeOfSupply: 'Maharashtra',
        placeOfSupplyCode: '27',
        reverseCharge: 'No',
        customer: {
          id: 'cust-2',
          name: 'Priya Patel',
          businessName: 'Patel Electronics & Logistics',
          gstin: '27AABCP8765Q1Z2',
          email: 'accounts@patelelec.com',
          phone: '+91 98200 54321',
          address: '15 Nariman Point, Express Towers, Mumbai',
          state: 'Maharashtra',
          stateCode: '27'
        },
        items: [
          {
            id: 'item-3',
            name: 'Custom ERP Software License (Annual)',
            hsn: '997331',
            qty: 1,
            unit: 'License',
            rate: 150000,
            discount: 10,
            discountType: 'percentage',
            taxableAmount: 135000,
            gstRate: 18,
            gstAmount: 24300,
            total: 159300
          }
        ],
        subtotal: 150000,
        totalDiscount: 15000,
        taxableValue: 135000,
        cgst: 0,
        sgst: 0,
        igst: 24300,
        totalGST: 24300,
        roundOff: 0.00,
        grandTotal: 159300,
        amountInWords: 'Rupees One Lakh Fifty-Nine Thousand Three Hundred Only',
        paymentMethod: 'Bank Transfer',
        paymentTerms: 'Net 15 days.',
        notes: 'Annual license includes 24/7 technical support and maintenance.',
        createdAt: d2.toISOString()
      },
      {
        id: 'inv-1003',
        invoiceNumber: 'INV-2026-1003',
        invoiceDate: toInputDate(d3),
        dueDate: toInputDate(addDays(d3, 10)),
        status: 'overdue',
        supplyType: 'inter',
        placeOfSupply: 'Delhi',
        placeOfSupplyCode: '07',
        reverseCharge: 'No',
        customer: {
          id: 'cust-3',
          name: 'Amit Verma',
          businessName: 'Verma Digital Media',
          gstin: '07AAACV9012K1Z8',
          email: 'amit@vermadigital.org',
          phone: '+91 99100 87654',
          address: '88 Barakhamba Road, Connaught Place, New Delhi',
          state: 'Delhi',
          stateCode: '07'
        },
        items: [
          {
            id: 'item-4',
            name: 'High-Performance Workstation Hardware Setup',
            hsn: '847130',
            qty: 2,
            unit: 'Sets',
            rate: 45000,
            discount: 0,
            discountType: 'flat',
            taxableAmount: 90000,
            gstRate: 18,
            gstAmount: 16200,
            total: 106200
          }
        ],
        subtotal: 90000,
        totalDiscount: 0,
        taxableValue: 90000,
        cgst: 0,
        sgst: 0,
        igst: 16200,
        totalGST: 16200,
        roundOff: 0.00,
        grandTotal: 106200,
        amountInWords: 'Rupees One Lakh Six Thousand Two Hundred Only',
        paymentMethod: 'UPI',
        paymentTerms: 'Payment due on receipt.',
        notes: 'Overdue invoice reminder sent on 25th.',
        createdAt: d3.toISOString()
      }
    ];
  }

  getAll() {
    return this.invoices;
  }

  getById(id) {
    return this.invoices.find(inv => inv.id === id);
  }

  saveInvoice(invoiceData) {
    if (this.editingInvoiceId) {
      const idx = this.invoices.findIndex(inv => inv.id === this.editingInvoiceId);
      if (idx !== -1) {
        this.invoices[idx] = {
          ...invoiceData,
          id: this.editingInvoiceId,
          updatedAt: new Date().toISOString()
        };
      }
      this.saveInvoices();
      return this.invoices[idx];
    } else {
      const newInv = {
        ...invoiceData,
        id: generateUUID(),
        createdAt: new Date().toISOString()
      };
      this.invoices.unshift(newInv);
      this.saveInvoices();
      this.app.settings.incrementInvoiceNumber();
      return newInv;
    }
  }

  deleteInvoice(id) {
    this.invoices = this.invoices.filter(inv => inv.id !== id);
    this.saveInvoices();
  }

  duplicateInvoice(id) {
    const original = this.getById(id);
    if (!original) return null;

    const duplicated = JSON.parse(JSON.stringify(original));
    duplicated.id = generateUUID();
    duplicated.invoiceNumber = this.app.settings.getNextInvoiceNumber();
    duplicated.invoiceDate = toInputDate(new Date());
    duplicated.dueDate = toInputDate(addDays(new Date(), this.app.settings.get().defaultDueDays || 15));
    duplicated.status = 'pending';
    duplicated.createdAt = new Date().toISOString();

    this.invoices.unshift(duplicated);
    this.saveInvoices();
    this.app.settings.incrementInvoiceNumber();
    return duplicated;
  }

  updateStatus(id, newStatus) {
    const inv = this.getById(id);
    if (inv) {
      inv.status = newStatus;
      inv.updatedAt = new Date().toISOString();
      this.saveInvoices();
    }
    return inv;
  }

  getDashboardStats() {
    let totalSales = 0;
    let totalGST = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    this.invoices.forEach(inv => {
      const grand = Number(inv.grandTotal) || 0;
      const gst = Number(inv.totalGST) || 0;

      totalSales += grand;
      totalGST += gst;

      if (inv.status === 'paid') {
        paidCount++;
      } else if (inv.status === 'overdue') {
        overdueCount++;
        pendingAmount += grand;
      } else {
        pendingCount++;
        pendingAmount += grand;
      }
    });

    return {
      totalInvoices: this.invoices.length,
      totalSales: roundTo2(totalSales),
      totalGST: roundTo2(totalGST),
      pendingAmount: roundTo2(pendingAmount),
      paidCount,
      pendingCount,
      overdueCount,
      recentInvoices: this.invoices.slice(0, 5)
    };
  }

  createNewInvoiceState() {
    const settings = this.app.settings ? this.app.settings.get() : {};
    const defaultDueDays = settings.defaultDueDays || 15;
    const defaultGstRate = settings.defaultGstRate || 18;

    return {
      invoiceNumber: this.app.settings ? this.app.settings.getNextInvoiceNumber() : 'INV-2026-1004',
      invoiceDate: toInputDate(new Date()),
      dueDate: toInputDate(addDays(new Date(), defaultDueDays)),
      status: 'pending',
      supplyType: 'intra',
      placeOfSupply: settings.state || 'Karnataka',
      placeOfSupplyCode: settings.stateCode || '29',
      reverseCharge: 'No',
      customer: {
        id: '',
        name: '',
        businessName: '',
        gstin: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: settings.state || 'Karnataka',
        stateCode: settings.stateCode || '29'
      },
      items: [
        this.createEmptyItem(defaultGstRate)
      ],
      paymentMethod: 'Bank Transfer',
      paymentTerms: settings.defaultPaymentTerms || 'Payment is due within 15 days of invoice date.',
      notes: settings.defaultNotes || 'Thank you for your business!'
    };
  }

  createEmptyItem(defaultRate = 18) {
    return {
      id: generateUUID(),
      name: '',
      hsn: '',
      qty: 1,
      unit: 'Pcs',
      rate: 0,
      discount: 0,
      discountType: 'flat',
      taxableAmount: 0,
      gstRate: defaultRate,
      gstAmount: 0,
      total: 0
    };
  }

  calculateItemRow(item) {
    const qty = Math.max(0, Number(item.qty) || 0);
    const rate = Math.max(0, Number(item.rate) || 0);
    const gross = roundTo2(qty * rate);

    let discountAmt = 0;
    const discountVal = Math.max(0, Number(item.discount) || 0);
    if (item.discountType === 'percentage') {
      discountAmt = roundTo2(gross * (Math.min(100, discountVal) / 100));
    } else {
      discountAmt = roundTo2(Math.min(gross, discountVal));
    }

    const taxableAmount = roundTo2(Math.max(0, gross - discountAmt));
    const gstRate = Math.max(0, Number(item.gstRate) || 0);
    const gstAmount = roundTo2(taxableAmount * (gstRate / 100));
    const total = roundTo2(taxableAmount + gstAmount);

    return {
      ...item,
      qty,
      rate,
      taxableAmount,
      gstAmount,
      total,
      calculatedDiscount: discountAmt
    };
  }

  calculateTotals(invoice) {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxableValue = 0;
    let totalGST = 0;

    const items = invoice.items.map(item => {
      const calculated = this.calculateItemRow(item);
      const gross = roundTo2((calculated.qty || 0) * (calculated.rate || 0));
      subtotal += gross;
      totalDiscount += (calculated.calculatedDiscount || 0);
      taxableValue += calculated.taxableAmount;
      totalGST += calculated.gstAmount;
      return calculated;
    });

    subtotal = roundTo2(subtotal);
    totalDiscount = roundTo2(totalDiscount);
    taxableValue = roundTo2(taxableValue);
    totalGST = roundTo2(totalGST);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (invoice.supplyType === 'intra') {
      cgst = roundTo2(totalGST / 2);
      sgst = roundTo2(totalGST - cgst);
      igst = 0;
    } else {
      cgst = 0;
      sgst = 0;
      igst = totalGST;
    }

    const unroundedGrandTotal = taxableValue + totalGST;
    const roundedGrandTotal = Math.round(unroundedGrandTotal);
    const roundOff = roundTo2(roundedGrandTotal - unroundedGrandTotal);

    return {
      items,
      subtotal,
      totalDiscount,
      taxableValue,
      cgst,
      sgst,
      igst,
      totalGST,
      roundOff,
      grandTotal: roundedGrandTotal,
      amountInWords: numberToWordsINR(roundedGrandTotal)
    };
  }

  init() {
    this.form = document.getElementById('invoice-form');
    this.itemsContainer = document.getElementById('invoice-items-body');
    this.addItemBtn = document.getElementById('add-item-btn');
    this.saveInvoiceBtn = document.getElementById('save-invoice-btn');
    this.previewInvoiceBtn = document.getElementById('preview-invoice-btn');
    this.printInvoiceBtn = document.getElementById('print-invoice-btn');
    this.downloadPdfBtn = document.getElementById('download-pdf-btn');
    this.resetInvoiceBtn = document.getElementById('reset-invoice-btn');

    this.customerSelect = document.getElementById('inv-customer-select');
    this.placeOfSupplySelect = document.getElementById('inv-place-of-supply');
    this.supplyTypeRadios = document.querySelectorAll('input[name="inv-supply-type"]');
    this.reverseChargeSelect = document.getElementById('inv-reverse-charge');

    if (!this.form) return;

    this.populateStates();
    this.bindEvents();
    this.resetToNew();
  }

  populateStates() {
    if (this.placeOfSupplySelect && this.placeOfSupplySelect.children.length <= 1) {
      INDIAN_STATES.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = `${s.name} (${s.code})`;
        opt.dataset.code = s.code;
        this.placeOfSupplySelect.appendChild(opt);
      });
    }

    const custStateSelect = document.getElementById('inv-cust-state');
    if (custStateSelect && custStateSelect.children.length <= 1) {
      INDIAN_STATES.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = `${s.name} (${s.code})`;
        opt.dataset.code = s.code;
        custStateSelect.appendChild(opt);
      });
    }
  }

  bindEvents() {
    if (this.addItemBtn) {
      this.addItemBtn.addEventListener('click', () => {
        const defRate = this.app.settings.get().defaultGstRate || 18;
        this.currentInvoice.items.push(this.createEmptyItem(defRate));
        this.renderItems();
        this.updateTotalsUI();
      });
    }

    if (this.customerSelect) {
      this.customerSelect.addEventListener('change', (e) => {
        const custId = e.target.value;
        if (custId === 'new') {
          this.clearCustomerFields();
        } else if (custId) {
          const cust = this.app.customers.getById(custId);
          if (cust) {
            this.setCustomerFields(cust);
          }
        }
      });
    }

    const custGstin = document.getElementById('inv-cust-gstin');
    if (custGstin) {
      custGstin.addEventListener('input', (e) => {
        const val = e.target.value.trim().toUpperCase();
        if (val.length >= 2) {
          const code = val.substring(0, 2);
          const matched = INDIAN_STATES.find(s => s.code === code);
          if (matched) {
            const custState = document.getElementById('inv-cust-state');
            if (custState) custState.value = matched.name;
            if (this.placeOfSupplySelect) this.placeOfSupplySelect.value = matched.name;
            this.autoDetectSupplyType(matched.name);
          }
        }
      });
    }

    if (this.placeOfSupplySelect) {
      this.placeOfSupplySelect.addEventListener('change', (e) => {
        this.currentInvoice.placeOfSupply = e.target.value;
        const opt = e.target.options[e.target.selectedIndex];
        this.currentInvoice.placeOfSupplyCode = opt ? opt.dataset.code : '';
        this.autoDetectSupplyType(e.target.value);
        this.updateTotalsUI();
      });
    }

    this.supplyTypeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.currentInvoice.supplyType = e.target.value;
          this.updateTotalsUI();
        }
      });
    });

    if (this.saveInvoiceBtn) {
      this.saveInvoiceBtn.addEventListener('click', () => {
        this.saveCurrentInvoice();
      });
    }

    if (this.previewInvoiceBtn) {
      this.previewInvoiceBtn.addEventListener('click', () => {
        const inv = this.gatherInvoiceData();
        if (this.validateInvoice(inv)) {
          this.app.printPdf.openPreviewModal(inv);
        }
      });
    }

    if (this.printInvoiceBtn) {
      this.printInvoiceBtn.addEventListener('click', () => {
        const inv = this.gatherInvoiceData();
        if (this.validateInvoice(inv)) {
          this.app.printPdf.print(inv);
        }
      });
    }

    if (this.downloadPdfBtn) {
      this.downloadPdfBtn.addEventListener('click', () => {
        const inv = this.gatherInvoiceData();
        if (this.validateInvoice(inv)) {
          this.app.printPdf.downloadPDF(inv);
        }
      });
    }

    if (this.resetInvoiceBtn) {
      this.resetInvoiceBtn.addEventListener('click', () => {
        if (confirm('Clear this invoice and start a new one?')) {
          this.resetToNew();
        }
      });
    }
  }

  autoDetectSupplyType(targetState) {
    const sellerState = this.app.settings.get().state || 'Karnataka';
    if (!targetState) return;

    if (sellerState.toLowerCase().trim() === targetState.toLowerCase().trim()) {
      this.setSupplyTypeRadio('intra');
    } else {
      this.setSupplyTypeRadio('inter');
    }
  }

  setSupplyTypeRadio(type) {
    this.currentInvoice.supplyType = type;
    this.supplyTypeRadios.forEach(r => {
      r.checked = (r.value === type);
    });
  }

  setCustomerFields(cust) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('inv-cust-name', cust.name);
    setVal('inv-cust-business', cust.businessName || '');
    setVal('inv-cust-gstin', cust.gstin || '');
    setVal('inv-cust-phone', cust.phone || '');
    setVal('inv-cust-email', cust.email || '');
    setVal('inv-cust-address', cust.address || '');
    setVal('inv-cust-state', cust.state || '');

    if (this.placeOfSupplySelect && cust.state) {
      this.placeOfSupplySelect.value = cust.state;
      this.autoDetectSupplyType(cust.state);
    }
    this.updateTotalsUI();
  }

  clearCustomerFields() {
    ['inv-cust-name', 'inv-cust-business', 'inv-cust-gstin', 'inv-cust-phone', 'inv-cust-email', 'inv-cust-address'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  resetToNew() {
    this.editingInvoiceId = null;
    this.currentInvoice = this.createNewInvoiceState();
    this.populateFormFields(this.currentInvoice);
    this.renderItems();
    this.updateTotalsUI();
    const heading = document.getElementById('invoice-editor-heading');
    if (heading) heading.textContent = 'Create Tax Invoice';
  }

  loadForEdit(invoiceId) {
    const inv = this.getById(invoiceId);
    if (!inv) return;

    this.editingInvoiceId = invoiceId;
    this.currentInvoice = JSON.parse(JSON.stringify(inv));
    this.populateFormFields(this.currentInvoice);
    this.renderItems();
    this.updateTotalsUI();

    const heading = document.getElementById('invoice-editor-heading');
    if (heading) heading.textContent = `Edit Invoice (${inv.invoiceNumber})`;

    this.app.navigateTo('create-invoice');
    this.app.showToast(`Loaded ${inv.invoiceNumber} for editing`, 'info');
  }

  populateFormFields(inv) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('inv-number', inv.invoiceNumber);
    setVal('inv-date', inv.invoiceDate);
    setVal('inv-due-date', inv.dueDate);
    setVal('inv-status', inv.status || 'pending');

    if (this.placeOfSupplySelect) this.placeOfSupplySelect.value = inv.placeOfSupply || '';
    this.setSupplyTypeRadio(inv.supplyType || 'intra');

    const revSelect = document.getElementById('inv-reverse-charge');
    if (revSelect) revSelect.value = inv.reverseCharge || 'No';

    const cust = inv.customer || {};
    setVal('inv-cust-name', cust.name);
    setVal('inv-cust-business', cust.businessName);
    setVal('inv-cust-gstin', cust.gstin);
    setVal('inv-cust-phone', cust.phone);
    setVal('inv-cust-email', cust.email);
    setVal('inv-cust-address', cust.address);
    setVal('inv-cust-state', cust.state);

    setVal('inv-payment-method', inv.paymentMethod || 'Bank Transfer');
    setVal('inv-payment-terms', inv.paymentTerms);
    setVal('inv-notes', inv.notes);

    if (this.customerSelect) {
      if (cust.id) {
        this.customerSelect.value = cust.id;
      } else {
        this.customerSelect.value = 'new';
      }
    }
  }

  renderItems() {
    if (!this.itemsContainer) return;
    this.itemsContainer.innerHTML = '';

    this.currentInvoice.items.forEach((item, index) => {
      const calculated = this.calculateItemRow(item);
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50/60 transition-colors item-row';
      tr.dataset.index = index;

      tr.innerHTML = `
        <td class="py-3 px-2 text-center text-xs font-semibold text-slate-500">${index + 1}</td>
        <td class="py-3 px-2">
          <input type="text" class="item-name-input w-full text-xs font-medium border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder="Product / Service description" value="${item.name || ''}" required>
        </td>
        <td class="py-3 px-2">
          <input type="text" class="item-hsn-input w-24 text-xs font-mono border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder="HSN/SAC" value="${item.hsn || ''}">
        </td>
        <td class="py-3 px-2">
          <div class="flex items-center space-x-1">
            <input type="number" step="0.01" min="0.01" class="item-qty-input w-16 text-xs text-right border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500" value="${item.qty || 1}">
            <select class="item-unit-select text-xs border border-slate-200 rounded px-1.5 py-1.5 bg-white text-slate-700">
              <option value="Pcs" ${item.unit === 'Pcs' ? 'selected' : ''}>Pcs</option>
              <option value="Box" ${item.unit === 'Box' ? 'selected' : ''}>Box</option>
              <option value="Kg" ${item.unit === 'Kg' ? 'selected' : ''}>Kg</option>
              <option value="Mtr" ${item.unit === 'Mtr' ? 'selected' : ''}>Mtr</option>
              <option value="Nos" ${item.unit === 'Nos' ? 'selected' : ''}>Nos</option>
              <option value="Hrs" ${item.unit === 'Hrs' ? 'selected' : ''}>Hrs</option>
              <option value="Month" ${item.unit === 'Month' ? 'selected' : ''}>Month</option>
              <option value="Sets" ${item.unit === 'Sets' ? 'selected' : ''}>Sets</option>
              <option value="Service" ${item.unit === 'Service' ? 'selected' : ''}>Service</option>
            </select>
          </div>
        </td>
        <td class="py-3 px-2">
          <div class="relative">
            <span class="absolute left-2 top-2 text-xs text-slate-400">₹</span>
            <input type="number" step="0.01" min="0" class="item-rate-input w-24 text-xs text-right border border-slate-200 rounded pl-5 pr-2 py-1.5 focus:ring-1 focus:ring-blue-500" placeholder="0.00" value="${item.rate || 0}">
          </div>
        </td>
        <td class="py-3 px-2">
          <div class="flex items-center space-x-1">
            <input type="number" step="0.01" min="0" class="item-discount-input w-16 text-xs text-right border border-slate-200 rounded px-1.5 py-1.5 focus:ring-1 focus:ring-blue-500" placeholder="0" value="${item.discount || 0}">
            <select class="item-discount-type-select text-xs border border-slate-200 rounded px-1 py-1.5 bg-white text-slate-700">
              <option value="flat" ${item.discountType === 'flat' ? 'selected' : ''}>₹</option>
              <option value="percentage" ${item.discountType === 'percentage' ? 'selected' : ''}>%</option>
            </select>
          </div>
        </td>
        <td class="py-3 px-2 text-right text-xs font-semibold text-slate-800 item-taxable-display">
          ${formatINR(calculated.taxableAmount)}
        </td>
        <td class="py-3 px-2">
          <select class="item-gst-select text-xs border border-slate-200 rounded px-2 py-1.5 bg-white font-medium text-slate-800">
            <option value="0" ${item.gstRate === 0 ? 'selected' : ''}>0%</option>
            <option value="5" ${item.gstRate === 5 ? 'selected' : ''}>5%</option>
            <option value="12" ${item.gstRate === 12 ? 'selected' : ''}>12%</option>
            <option value="18" ${item.gstRate === 18 ? 'selected' : ''}>18%</option>
            <option value="28" ${item.gstRate === 28 ? 'selected' : ''}>28%</option>
          </select>
        </td>
        <td class="py-3 px-2 text-right text-xs text-blue-600 font-semibold item-gst-amount-display">
          ${formatINR(calculated.gstAmount)}
        </td>
        <td class="py-3 px-2 text-right text-xs font-bold text-slate-900 item-total-display">
          ${formatINR(calculated.total)}
        </td>
        <td class="py-3 px-2 text-center">
          <div class="flex items-center justify-center space-x-1">
            <button type="button" class="btn-clone-item text-slate-400 hover:text-blue-600 p-1" title="Duplicate row">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" class="btn-remove-item text-slate-400 hover:text-rose-600 p-1" title="Delete row">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      `;

      this.attachItemRowListeners(tr, index);
      this.itemsContainer.appendChild(tr);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  attachItemRowListeners(row, index) {
    const item = this.currentInvoice.items[index];

    const onInputChange = () => {
      item.name = row.querySelector('.item-name-input').value;
      item.hsn = row.querySelector('.item-hsn-input').value.trim();
      item.qty = parseFloat(row.querySelector('.item-qty-input').value) || 0;
      item.unit = row.querySelector('.item-unit-select').value;
      item.rate = parseFloat(row.querySelector('.item-rate-input').value) || 0;
      item.discount = parseFloat(row.querySelector('.item-discount-input').value) || 0;
      item.discountType = row.querySelector('.item-discount-type-select').value;
      item.gstRate = parseFloat(row.querySelector('.item-gst-select').value) || 0;

      const calc = this.calculateItemRow(item);
      row.querySelector('.item-taxable-display').textContent = formatINR(calc.taxableAmount);
      row.querySelector('.item-gst-amount-display').textContent = formatINR(calc.gstAmount);
      row.querySelector('.item-total-display').textContent = formatINR(calc.total);

      this.updateTotalsUI();
    };

    row.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('input', onInputChange);
      input.addEventListener('change', onInputChange);
    });

    row.querySelector('.btn-clone-item').addEventListener('click', () => {
      const cloned = JSON.parse(JSON.stringify(item));
      cloned.id = generateUUID();
      this.currentInvoice.items.splice(index + 1, 0, cloned);
      this.renderItems();
      this.updateTotalsUI();
    });

    row.querySelector('.btn-remove-item').addEventListener('click', () => {
      if (this.currentInvoice.items.length <= 1) {
        this.app.showToast('Invoice must have at least one item', 'warning');
        return;
      }
      this.currentInvoice.items.splice(index, 1);
      this.renderItems();
      this.updateTotalsUI();
    });
  }

  updateTotalsUI() {
    const calc = this.calculateTotals(this.currentInvoice);

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText('inv-subtotal-display', formatINR(calc.subtotal));
    setText('inv-discount-display', formatINR(calc.totalDiscount));
    setText('inv-taxable-display', formatINR(calc.taxableValue));
    setText('inv-total-gst-display', formatINR(calc.totalGST));
    setText('inv-roundoff-display', formatINR(calc.roundOff));
    setText('inv-grand-total-display', formatINR(calc.grandTotal));
    setText('inv-words-display', calc.amountInWords);

    const intraBox = document.getElementById('inv-intra-tax-summary');
    const interBox = document.getElementById('inv-inter-tax-summary');

    if (this.currentInvoice.supplyType === 'intra') {
      if (intraBox) intraBox.classList.remove('hidden');
      if (interBox) interBox.classList.add('hidden');
      setText('inv-cgst-display', formatINR(calc.cgst));
      setText('inv-sgst-display', formatINR(calc.sgst));
    } else {
      if (intraBox) intraBox.classList.add('hidden');
      if (interBox) interBox.classList.remove('hidden');
      setText('inv-igst-display', formatINR(calc.igst));
    }
  }

  gatherInvoiceData() {
    const inv = { ...this.currentInvoice };
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    inv.invoiceNumber = getVal('inv-number') || this.app.settings.getNextInvoiceNumber();
    inv.invoiceDate = getVal('inv-date') || toInputDate(new Date());
    inv.dueDate = getVal('inv-due-date') || toInputDate(addDays(new Date(), 15));
    inv.status = getVal('inv-status') || 'pending';
    inv.placeOfSupply = this.placeOfSupplySelect ? this.placeOfSupplySelect.value : '';
    const posOption = this.placeOfSupplySelect ? this.placeOfSupplySelect.options[this.placeOfSupplySelect.selectedIndex] : null;
    inv.placeOfSupplyCode = posOption && posOption.dataset.code ? posOption.dataset.code : '';
    inv.reverseCharge = document.getElementById('inv-reverse-charge') ? document.getElementById('inv-reverse-charge').value : 'No';

    const custStateEl = document.getElementById('inv-cust-state');
    const custStateOpt = custStateEl ? custStateEl.options[custStateEl.selectedIndex] : null;

    inv.customer = {
      name: getVal('inv-cust-name'),
      businessName: getVal('inv-cust-business'),
      gstin: getVal('inv-cust-gstin').toUpperCase(),
      phone: getVal('inv-cust-phone'),
      email: getVal('inv-cust-email'),
      address: getVal('inv-cust-address'),
      state: custStateEl ? custStateEl.value : '',
      stateCode: custStateOpt && custStateOpt.dataset.code ? custStateOpt.dataset.code : ''
    };

    inv.paymentMethod = getVal('inv-payment-method') || 'Bank Transfer';
    inv.paymentTerms = getVal('inv-payment-terms');
    inv.notes = getVal('inv-notes');

    const totals = this.calculateTotals(inv);
    return {
      ...inv,
      ...totals
    };
  }

  validateInvoice(invoice) {
    if (!invoice.invoiceNumber) {
      this.app.showToast('Invoice Number is required', 'error');
      return false;
    }
    if (!invoice.customer.name && !invoice.customer.businessName) {
      this.app.showToast('Customer Name is required', 'error');
      return false;
    }
    if (!invoice.items || invoice.items.length === 0) {
      this.app.showToast('Please add at least one item', 'error');
      return false;
    }
    const hasInvalidItem = invoice.items.some(it => !it.name || it.qty <= 0);
    if (hasInvalidItem) {
      this.app.showToast('Each row must have a description and valid quantity', 'warning');
      return false;
    }

    if (invoice.customer.gstin) {
      const gstinVal = validateGSTIN(invoice.customer.gstin);
      if (!gstinVal.valid) {
        this.app.showToast(`Customer GSTIN warning: ${gstinVal.message}`, 'warning');
      }
    }

    return true;
  }

  saveCurrentInvoice() {
    const invoiceData = this.gatherInvoiceData();
    if (!this.validateInvoice(invoiceData)) return;

    const saved = this.saveInvoice(invoiceData);
    this.app.showToast(`Invoice ${saved.invoiceNumber} saved successfully!`, 'success');
    this.app.dashboard.render();
    this.app.invoicesHistory.render();

    if (invoiceData.customer.name && !invoiceData.customer.id) {
      const existing = this.app.customers.getAll().find(c => 
        (invoiceData.customer.gstin && c.gstin === invoiceData.customer.gstin) ||
        c.name.toLowerCase() === invoiceData.customer.name.toLowerCase()
      );
      if (!existing) {
        this.app.customers.add(invoiceData.customer);
      }
    }

    this.resetToNew();
    this.app.navigateTo('invoices');
  }
}

// ============================================================================
// 6. PRINT & PDF GENERATOR MODULE
// ============================================================================

class PrintPdfManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    this.modal = document.getElementById('preview-modal');
    this.modalContent = document.getElementById('preview-modal-content');
    this.closeModalBtn = document.getElementById('preview-modal-close');
    this.modalPrintBtn = document.getElementById('preview-modal-print');
    this.modalDownloadBtn = document.getElementById('preview-modal-download');
    this.printArea = document.getElementById('print-area');

    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', () => {
        this.closePreviewModal();
      });
    }

    if (this.modalPrintBtn) {
      this.modalPrintBtn.addEventListener('click', () => {
        if (this.activeInvoice) {
          this.print(this.activeInvoice);
        }
      });
    }

    if (this.modalDownloadBtn) {
      this.modalDownloadBtn.addEventListener('click', () => {
        if (this.activeInvoice) {
          this.downloadPDF(this.activeInvoice);
        }
      });
    }
  }

  openPreviewModal(invoice) {
    this.activeInvoice = invoice;
    const settings = this.app.settings.get();
    const html = this.generateInvoiceHTML(invoice, settings);

    if (this.modalContent) {
      this.modalContent.innerHTML = html;
      this.generateUPIQRCode(invoice, settings, 'modal-upi-qrcode');
    }

    if (this.modal) {
      this.modal.classList.remove('hidden');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  closePreviewModal() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
    this.activeInvoice = null;
  }

  print(invoice) {
    const settings = this.app.settings.get();
    const html = this.generateInvoiceHTML(invoice, settings);

    if (this.printArea) {
      this.printArea.innerHTML = html;
      this.generateUPIQRCode(invoice, settings, 'print-upi-qrcode');
      
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }

  async downloadPDF(invoice) {
    const settings = this.app.settings.get();
    const html = this.generateInvoiceHTML(invoice, settings);

    const tempContainer = document.createElement('div');
    tempContainer.className = 'pdf-render-container';
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '0';
    tempContainer.style.width = '210mm';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.innerHTML = html;
    document.body.appendChild(tempContainer);

    this.generateUPIQRCode(invoice, settings, 'temp-upi-qrcode', tempContainer);

    this.app.showToast('Generating PDF, please wait...', 'info');

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${invoice.invoiceNumber || 'Tax_Invoice'}_${(invoice.customer.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      if (window.html2pdf) {
        await window.html2pdf().set(opt).from(tempContainer.firstElementChild).save();
        this.app.showToast('PDF downloaded successfully!', 'success');
      } else {
        this.app.showToast('Opening print dialog for PDF export...', 'info');
        this.print(invoice);
      }
    } catch (err) {
      console.error('PDF generation error', err);
      this.app.showToast('Error generating PDF. Using standard print dialog.', 'warning');
      this.print(invoice);
    } finally {
      if (tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  }

  generateUPIQRCode(invoice, settings, targetId, root = document) {
    if (!settings.upiId) return;

    const qrElement = root.querySelector ? root.querySelector(`#${targetId}`) : document.getElementById(targetId);
    if (!qrElement) return;

    qrElement.innerHTML = '';
    const cleanUpi = encodeURIComponent(settings.upiId.trim());
    const cleanName = encodeURIComponent((settings.tradeName || settings.businessName || 'Business').trim());
    const amount = Number(invoice.grandTotal) || 0;
    const note = encodeURIComponent(`Invoice ${invoice.invoiceNumber}`);

    const upiUri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${amount.toFixed(2)}&cu=INR&tn=${note}`;

    if (window.QRCode) {
      new window.QRCode(qrElement, {
        text: upiUri,
        width: 80,
        height: 80,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
    }
  }

  generateHSNSummary(invoice) {
    const isIntra = invoice.supplyType === 'intra';
    const hsnMap = {};

    invoice.items.forEach(item => {
      const code = item.hsn || 'N/A';
      if (!hsnMap[code]) {
        hsnMap[code] = {
          taxable: 0,
          rate: item.gstRate,
          gstAmount: 0
        };
      }
      hsnMap[code].taxable += item.taxableAmount || 0;
      hsnMap[code].gstAmount += item.gstAmount || 0;
    });

    return Object.entries(hsnMap).map(([hsn, data]) => {
      const taxable = data.taxable;
      const rate = data.rate;
      const gst = data.gstAmount;

      if (isIntra) {
        const halfRate = rate / 2;
        const halfTax = gst / 2;
        return `
          <tr class="border-b border-slate-200 text-xs">
            <td class="py-1 px-2 font-mono">${escapeHTML(hsn)}</td>
            <td class="py-1 px-2 text-right">${formatINR(taxable)}</td>
            <td class="py-1 px-2 text-right">${halfRate}%</td>
            <td class="py-1 px-2 text-right">${formatINR(halfTax)}</td>
            <td class="py-1 px-2 text-right">${halfRate}%</td>
            <td class="py-1 px-2 text-right">${formatINR(halfTax)}</td>
            <td class="py-1 px-2 text-right font-medium">${formatINR(gst)}</td>
          </tr>
        `;
      } else {
        return `
          <tr class="border-b border-slate-200 text-xs">
            <td class="py-1 px-2 font-mono">${escapeHTML(hsn)}</td>
            <td class="py-1 px-2 text-right">${formatINR(taxable)}</td>
            <td class="py-1 px-2 text-right">${rate}%</td>
            <td class="py-1 px-2 text-right">${formatINR(gst)}</td>
            <td class="py-1 px-2 text-right font-medium">${formatINR(gst)}</td>
          </tr>
        `;
      }
    }).join('');
  }

  generateInvoiceHTML(invoice, settings) {
    const isIntra = invoice.supplyType === 'intra';
    const cust = invoice.customer || {};

    const itemsRows = invoice.items.map((it, idx) => `
      <tr class="border-b border-slate-200 text-xs leading-relaxed">
        <td class="py-2 px-2 text-center text-slate-500 font-medium">${idx + 1}</td>
        <td class="py-2 px-2 font-semibold text-slate-900">${escapeHTML(it.name)}</td>
        <td class="py-2 px-2 text-center font-mono text-slate-600">${escapeHTML(it.hsn || '-')}</td>
        <td class="py-2 px-2 text-right text-slate-800">${it.qty} ${escapeHTML(it.unit || '')}</td>
        <td class="py-2 px-2 text-right text-slate-800">${formatINR(it.rate)}</td>
        <td class="py-2 px-2 text-right text-slate-500">${it.discount ? (it.discountType === 'percentage' ? `${it.discount}%` : formatINR(it.discount)) : '-'}</td>
        <td class="py-2 px-2 text-right font-medium text-slate-900">${formatINR(it.taxableAmount)}</td>
        <td class="py-2 px-2 text-right text-slate-700">${it.gstRate}%</td>
        <td class="py-2 px-2 text-right text-slate-700">${formatINR(it.gstAmount)}</td>
        <td class="py-2 px-2 text-right font-bold text-slate-900">${formatINR(it.total)}</td>
      </tr>
    `).join('');

    const hsnRows = this.generateHSNSummary(invoice);

    const hsnHeaders = isIntra ? `
      <th class="py-1 px-2 text-left">HSN/SAC</th>
      <th class="py-1 px-2 text-right">Taxable Value</th>
      <th class="py-1 px-2 text-right">CGST Rate</th>
      <th class="py-1 px-2 text-right">CGST Amt</th>
      <th class="py-1 px-2 text-right">SGST Rate</th>
      <th class="py-1 px-2 text-right">SGST Amt</th>
      <th class="py-1 px-2 text-right">Total Tax</th>
    ` : `
      <th class="py-1 px-2 text-left">HSN/SAC</th>
      <th class="py-1 px-2 text-right">Taxable Value</th>
      <th class="py-1 px-2 text-right">IGST Rate</th>
      <th class="py-1 px-2 text-right">IGST Amt</th>
      <th class="py-1 px-2 text-right">Total Tax</th>
    `;

    return `
      <div class="a4-invoice-sheet bg-white text-slate-900 p-8 max-w-[210mm] mx-auto border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 font-sans">
        
        <!-- Header Top: Company Logo & Tax Invoice Badges -->
        <div class="border-b-2 border-blue-600 pb-4 mb-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-4">
              ${settings.logoUrl ? `
                <img src="${settings.logoUrl}" alt="Logo" class="max-h-16 max-w-[160px] object-contain rounded" />
              ` : `
                <div class="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-xl">
                  ${escapeHTML((settings.businessName || 'G').charAt(0))}
                </div>
              `}
              <div>
                <h1 class="text-xl font-bold text-slate-900 tracking-tight">${escapeHTML(settings.businessName)}</h1>
                ${settings.tradeName ? `<p class="text-xs text-blue-700 font-semibold uppercase tracking-wider">${escapeHTML(settings.tradeName)}</p>` : ''}
                <p class="text-xs text-slate-600 mt-0.5">${escapeHTML(settings.address)}, ${escapeHTML(settings.city)} - ${escapeHTML(settings.pincode)}</p>
                <div class="flex items-center space-x-3 text-xs text-slate-700 font-medium mt-1">
                  <span><strong>GSTIN:</strong> <span class="font-mono">${escapeHTML(settings.gstin)}</span></span>
                  <span><strong>PAN:</strong> <span class="font-mono">${escapeHTML(settings.pan || '-')}</span></span>
                  <span><strong>State:</strong> ${escapeHTML(settings.state)} (${escapeHTML(settings.stateCode)})</span>
                </div>
              </div>
            </div>

            <div class="text-right">
              <span class="inline-block bg-blue-600 text-white text-xs font-bold uppercase px-3 py-1 rounded tracking-widest mb-1">
                TAX INVOICE
              </span>
              <p class="text-[10px] text-slate-500 font-medium">Original for Recipient</p>
              <div class="mt-2 text-xs text-slate-600">
                <p><span class="font-semibold text-slate-800">Invoice No:</span> <span class="font-mono font-bold text-slate-900">${escapeHTML(invoice.invoiceNumber)}</span></p>
                <p><span class="font-semibold text-slate-800">Date:</span> ${formatDate(invoice.invoiceDate)}</p>
                <p><span class="font-semibold text-slate-800">Due Date:</span> ${formatDate(invoice.dueDate)}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Details Grid: Bill To & Supply Metadata -->
        <div class="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3 text-xs mb-4 bg-slate-50/50">
          <div>
            <h3 class="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-200">
              Details of Receiver / Billed To:
            </h3>
            <p class="font-bold text-sm text-slate-900">${escapeHTML(cust.name)}</p>
            ${cust.businessName ? `<p class="font-semibold text-slate-700">${escapeHTML(cust.businessName)}</p>` : ''}
            <p class="text-slate-600 mt-0.5">${escapeHTML(cust.address || 'Address not provided')}</p>
            <p class="text-slate-600">${escapeHTML(cust.city || '')} ${cust.state ? `- ${escapeHTML(cust.state)}` : ''}</p>
            <div class="mt-1.5 pt-1.5 border-t border-slate-200/70 space-y-0.5">
              <p><strong class="text-slate-800">GSTIN / UIN:</strong> <span class="font-mono font-semibold">${escapeHTML(cust.gstin || 'Unregistered')}</span></p>
              <p><strong class="text-slate-800">State:</strong> ${escapeHTML(cust.state || '-')} (Code: ${escapeHTML(cust.stateCode || '-')})</p>
              ${cust.phone ? `<p><strong class="text-slate-800">Phone:</strong> ${escapeHTML(cust.phone)}</p>` : ''}
            </div>
          </div>

          <div>
            <h3 class="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-200">
              Invoice & Supply Information:
            </h3>
            <div class="space-y-1">
              <div class="flex justify-between"><span class="text-slate-600">Place of Supply:</span> <span class="font-semibold text-slate-800">${escapeHTML(invoice.placeOfSupply)} (${escapeHTML(invoice.placeOfSupplyCode)})</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Supply Type:</span> <span class="font-semibold text-blue-700 uppercase">${isIntra ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Reverse Charge:</span> <span class="font-semibold text-slate-800">${escapeHTML(invoice.reverseCharge)}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Payment Status:</span> <span class="font-bold uppercase ${invoice.status === 'paid' ? 'text-emerald-700' : (invoice.status === 'overdue' ? 'text-rose-700' : 'text-amber-700')}">${escapeHTML(invoice.status)}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Payment Method:</span> <span class="font-medium text-slate-800">${escapeHTML(invoice.paymentMethod || 'Bank Transfer')}</span></div>
            </div>
          </div>
        </div>

        <!-- Product / Service Items Table -->
        <table class="w-full border-collapse border border-slate-300 mb-4">
          <thead>
            <tr class="bg-slate-100 text-slate-700 text-[11px] uppercase tracking-wider border-b border-slate-300">
              <th class="py-2 px-2 text-center w-8">#</th>
              <th class="py-2 px-2 text-left">Description of Goods / Services</th>
              <th class="py-2 px-2 text-center w-16">HSN/SAC</th>
              <th class="py-2 px-2 text-right w-16">Qty</th>
              <th class="py-2 px-2 text-right w-20">Rate (₹)</th>
              <th class="py-2 px-2 text-right w-16">Disc.</th>
              <th class="py-2 px-2 text-right w-24">Taxable (₹)</th>
              <th class="py-2 px-2 text-right w-14">GST %</th>
              <th class="py-2 px-2 text-right w-20">GST (₹)</th>
              <th class="py-2 px-2 text-right w-24">Total (₹)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            ${itemsRows}
          </tbody>
        </table>

        <!-- Amount In Words & Totals Summary Split -->
        <div class="grid grid-cols-12 gap-4 mb-4">
          <div class="col-span-7 flex flex-col justify-between">
            <div>
              <div class="border border-slate-300 rounded p-2.5 bg-blue-50/30 text-xs mb-3">
                <span class="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Total Amount in Words:</span>
                <p class="font-bold text-slate-900 mt-0.5 italic leading-tight">${escapeHTML(invoice.amountInWords)}</p>
              </div>

              <!-- HSN Summary Table -->
              <div class="border border-slate-300 rounded overflow-hidden">
                <div class="bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">
                  GST Tax Breakdown by HSN/SAC
                </div>
                <table class="w-full text-[11px]">
                  <thead class="bg-slate-50 text-[10px] text-slate-600 border-b border-slate-200">
                    <tr>${hsnHeaders}</tr>
                  </thead>
                  <tbody>
                    ${hsnRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="col-span-5">
            <div class="border border-slate-300 rounded bg-slate-50/50 p-3 text-xs space-y-2">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal (Gross):</span>
                <span class="font-medium text-slate-800">${formatINR(invoice.subtotal)}</span>
              </div>
              ${invoice.totalDiscount > 0 ? `
                <div class="flex justify-between text-slate-600">
                  <span>Total Discount:</span>
                  <span class="text-rose-600 font-medium">-${formatINR(invoice.totalDiscount)}</span>
                </div>
              ` : ''}
              <div class="flex justify-between text-slate-800 font-semibold border-t border-slate-200 pt-1.5">
                <span>Total Taxable Value:</span>
                <span>${formatINR(invoice.taxableValue)}</span>
              </div>

              ${isIntra ? `
                <div class="flex justify-between text-slate-600">
                  <span>CGST Total:</span>
                  <span class="font-medium text-slate-800">${formatINR(invoice.cgst)}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>SGST Total:</span>
                  <span class="font-medium text-slate-800">${formatINR(invoice.sgst)}</span>
                </div>
              ` : `
                <div class="flex justify-between text-slate-600">
                  <span>IGST Total:</span>
                  <span class="font-medium text-slate-800">${formatINR(invoice.igst)}</span>
                </div>
              `}

              <div class="flex justify-between text-blue-700 font-medium">
                <span>Total GST Amount:</span>
                <span>${formatINR(invoice.totalGST)}</span>
              </div>

              ${invoice.roundOff !== 0 ? `
                <div class="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span>${invoice.roundOff > 0 ? '+' : ''}${formatINR(invoice.roundOff, false)}</span>
                </div>
              ` : ''}

              <div class="flex justify-between items-center text-sm font-bold text-slate-900 border-t-2 border-slate-800 pt-2 bg-blue-50/60 p-2 rounded">
                <span>Grand Total:</span>
                <span class="text-base text-blue-900">${formatINR(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bank Details, UPI QR Code, & Signatory Block -->
        <div class="border border-slate-300 rounded-lg p-3 text-xs mb-3 bg-slate-50/30">
          <div class="grid grid-cols-12 gap-4 items-center">
            <div class="col-span-5 border-r border-slate-200 pr-3">
              <h4 class="font-bold text-blue-900 uppercase text-[10px] tracking-wider mb-1">Bank Payment Details:</h4>
              <p><strong class="text-slate-700">Bank:</strong> ${escapeHTML(settings.bankName)}</p>
              <p><strong class="text-slate-700">A/C Number:</strong> <span class="font-mono font-bold">${escapeHTML(settings.accountNumber)}</span></p>
              <p><strong class="text-slate-700">Account Name:</strong> ${escapeHTML(settings.accountHolder)}</p>
              <p><strong class="text-slate-700">IFSC Code:</strong> <span class="font-mono font-bold">${escapeHTML(settings.ifscCode)}</span></p>
              ${settings.branch ? `<p><strong class="text-slate-700">Branch:</strong> ${escapeHTML(settings.branch)}</p>` : ''}
            </div>

            <div class="col-span-3 flex flex-col items-center justify-center border-r border-slate-200 pr-3">
              ${settings.upiId ? `
                <div id="${this.activeInvoice ? 'modal-upi-qrcode' : 'print-upi-qrcode'}" class="p-1 bg-white border border-slate-300 rounded"></div>
                <span class="text-[9px] text-slate-500 font-semibold mt-1">Scan & Pay via UPI</span>
                <span class="text-[9px] text-blue-600 font-mono">${escapeHTML(settings.upiId)}</span>
              ` : `
                <span class="text-xs text-slate-400 italic">No UPI ID configured</span>
              `}
            </div>

            <div class="col-span-4 text-center flex flex-col justify-between h-full pt-1">
              <div>
                <p class="text-[10px] text-slate-500 font-semibold">For <span class="text-slate-900 font-bold">${escapeHTML(settings.businessName)}</span></p>
              </div>
              <div class="mt-8 border-t border-slate-400 mx-6 pt-1">
                <p class="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer: Terms & Notes -->
        <div class="text-[10px] text-slate-500 space-y-1 border-t border-slate-200 pt-2">
          ${invoice.paymentTerms ? `<p><strong>Terms & Conditions:</strong> ${escapeHTML(invoice.paymentTerms)}</p>` : ''}
          ${invoice.notes ? `<p><strong>Notes:</strong> ${escapeHTML(invoice.notes)}</p>` : ''}
          <p class="italic text-slate-400 text-center pt-1">${escapeHTML(settings.declaration || 'This is a computer generated invoice.')}</p>
        </div>

      </div>
    `;
  }
}

// ============================================================================
// 7. DASHBOARD MODULE
// ============================================================================

class DashboardManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    this.container = document.getElementById('dashboard-view');
    this.render();
  }

  render() {
    const stats = this.app.invoices.getDashboardStats();

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText('dash-total-sales', formatINR(stats.totalSales));
    setText('dash-total-gst', formatINR(stats.totalGST));
    setText('dash-pending-payments', formatINR(stats.pendingAmount));
    setText('dash-paid-count', `${stats.paidCount} / ${stats.totalInvoices}`);

    const tableBody = document.getElementById('dash-recent-invoices-body');
    if (tableBody) {
      if (stats.recentInvoices.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-8 text-slate-500 text-xs">
              No invoices created yet. Click "Create Invoice" to begin.
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = stats.recentInvoices.map(inv => {
          const statusColors = {
            paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            overdue: 'bg-rose-50 text-rose-700 border-rose-200',
            draft: 'bg-slate-100 text-slate-600 border-slate-200'
          };
          const colorClass = statusColors[inv.status] || statusColors.pending;

          return `
            <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
              <td class="py-3 px-4 text-xs font-mono font-bold text-slate-900">
                ${escapeHTML(inv.invoiceNumber)}
              </td>
              <td class="py-3 px-4 text-xs">
                <span class="font-semibold text-slate-900 block">${escapeHTML(inv.customer.name)}</span>
                ${inv.customer.businessName ? `<span class="text-slate-500 text-[11px] block">${escapeHTML(inv.customer.businessName)}</span>` : ''}
              </td>
              <td class="py-3 px-4 text-xs text-slate-600">
                ${formatDate(inv.invoiceDate)}
              </td>
              <td class="py-3 px-4 text-xs font-bold text-slate-900 text-right">
                ${formatINR(inv.grandTotal)}
              </td>
              <td class="py-3 px-4 text-xs text-center">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${colorClass}">
                  ${escapeHTML(inv.status)}
                </span>
              </td>
              <td class="py-3 px-4 text-xs text-right">
                <div class="flex items-center justify-end space-x-1">
                  <button type="button" class="btn-dash-preview p-1 text-slate-500 hover:text-blue-600 rounded" data-id="${inv.id}" title="Preview Invoice">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                  <button type="button" class="btn-dash-pdf p-1 text-slate-500 hover:text-emerald-600 rounded" data-id="${inv.id}" title="Download PDF">
                    <i data-lucide="download" class="w-4 h-4"></i>
                  </button>
                  <button type="button" class="btn-dash-edit p-1 text-slate-500 hover:text-indigo-600 rounded" data-id="${inv.id}" title="Edit Invoice">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

        tableBody.querySelectorAll('.btn-dash-preview').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const inv = this.app.invoices.getById(id);
            if (inv) this.app.printPdf.openPreviewModal(inv);
          });
        });

        tableBody.querySelectorAll('.btn-dash-pdf').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const inv = this.app.invoices.getById(id);
            if (inv) this.app.printPdf.downloadPDF(inv);
          });
        });

        tableBody.querySelectorAll('.btn-dash-edit').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            this.app.invoices.loadForEdit(id);
          });
        });
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }
}

// ============================================================================
// 8. INVOICES HISTORY MODULE
// ============================================================================

class InvoicesHistoryManager {
  constructor(app) {
    this.app = app;
    this.filters = {
      search: '',
      status: 'all',
      customer: 'all',
      dateRange: 'all'
    };
  }

  init() {
    this.container = document.getElementById('invoices-table-body');
    this.searchInput = document.getElementById('inv-history-search');
    this.statusFilter = document.getElementById('inv-history-status-filter');
    this.customerFilter = document.getElementById('inv-history-customer-filter');
    this.dateFilter = document.getElementById('inv-history-date-filter');
    this.countBadge = document.getElementById('invoices-count-badge');

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    if (this.statusFilter) {
      this.statusFilter.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.render();
      });
    }

    if (this.customerFilter) {
      this.customerFilter.addEventListener('change', (e) => {
        this.filters.customer = e.target.value;
        this.render();
      });
    }

    if (this.dateFilter) {
      this.dateFilter.addEventListener('change', (e) => {
        this.filters.dateRange = e.target.value;
        this.render();
      });
    }

    this.render();
  }

  populateCustomerFilter() {
    if (!this.customerFilter) return;
    const currentVal = this.customerFilter.value;
    const customers = this.app.customers ? this.app.customers.getAll() : [];

    this.customerFilter.innerHTML = '<option value="all">All Customers</option>';
    customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name}${c.businessName ? ` (${c.businessName})` : ''}`;
      this.customerFilter.appendChild(opt);
    });

    this.customerFilter.value = currentVal;
  }

  render() {
    if (!this.container) return;

    let invoices = this.app.invoices.getAll();

    if (this.filters.search) {
      const q = this.filters.search;
      invoices = invoices.filter(inv => 
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
        (inv.customer.name && inv.customer.name.toLowerCase().includes(q)) ||
        (inv.customer.businessName && inv.customer.businessName.toLowerCase().includes(q)) ||
        (inv.customer.gstin && inv.customer.gstin.toLowerCase().includes(q))
      );
    }

    if (this.filters.status !== 'all') {
      invoices = invoices.filter(inv => inv.status === this.filters.status);
    }

    if (this.filters.customer !== 'all') {
      invoices = invoices.filter(inv => inv.customer.id === this.filters.customer);
    }

    if (this.filters.dateRange !== 'all') {
      const now = new Date();
      invoices = invoices.filter(inv => {
        const invDate = new Date(inv.invoiceDate);
        if (this.filters.dateRange === 'today') {
          return invDate.toDateString() === now.toDateString();
        } else if (this.filters.dateRange === 'this_month') {
          return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
        } else if (this.filters.dateRange === 'last_month') {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const yr = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          return invDate.getMonth() === lastMonth && invDate.getFullYear() === yr;
        }
        return true;
      });
    }

    if (this.countBadge) {
      this.countBadge.textContent = `${invoices.length} invoices`;
    }

    if (invoices.length === 0) {
      this.container.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-12 text-slate-500 bg-white">
            <div class="max-w-xs mx-auto text-center">
              <i data-lucide="file-x" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
              <p class="font-semibold text-slate-800 text-sm">No matching invoices found</p>
              <p class="text-xs text-slate-500 mt-1">Try resetting the filters or create a new invoice.</p>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    this.container.innerHTML = invoices.map(inv => {
      const statusColors = {
        paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        overdue: 'bg-rose-50 text-rose-700 border-rose-200',
        draft: 'bg-slate-100 text-slate-600 border-slate-200'
      };
      const colorClass = statusColors[inv.status] || statusColors.pending;

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
          <td class="py-3 px-4 text-xs font-mono font-bold text-blue-900">
            ${escapeHTML(inv.invoiceNumber)}
          </td>
          <td class="py-3 px-4 text-xs">
            <div class="font-semibold text-slate-900">${escapeHTML(inv.customer.name)}</div>
            ${inv.customer.businessName ? `<div class="text-[11px] text-slate-500 font-medium">${escapeHTML(inv.customer.businessName)}</div>` : ''}
            ${inv.customer.gstin ? `<div class="text-[10px] font-mono text-slate-600">${escapeHTML(inv.customer.gstin)}</div>` : ''}
          </td>
          <td class="py-3 px-4 text-xs text-slate-600">
            <div>${formatDate(inv.invoiceDate)}</div>
            <div class="text-[10px] text-slate-400">Due: ${formatDate(inv.dueDate)}</div>
          </td>
          <td class="py-3 px-4 text-xs text-right">
            <div class="font-bold text-slate-900">${formatINR(inv.grandTotal)}</div>
            <div class="text-[10px] text-slate-500">GST: ${formatINR(inv.totalGST)}</div>
          </td>
          <td class="py-3 px-4 text-xs text-center">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${inv.supplyType === 'intra' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}">
              ${inv.supplyType === 'intra' ? 'CGST+SGST' : 'IGST'}
            </span>
          </td>
          <td class="py-3 px-4 text-xs text-center">
            <select class="inv-status-selector text-[11px] font-semibold uppercase rounded px-2 py-1 border cursor-pointer ${colorClass}" data-id="${inv.id}">
              <option value="paid" ${inv.status === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="pending" ${inv.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="overdue" ${inv.status === 'overdue' ? 'selected' : ''}>Overdue</option>
              <option value="draft" ${inv.status === 'draft' ? 'selected' : ''}>Draft</option>
            </select>
          </td>
          <td class="py-3 px-4 text-xs text-right">
            <div class="flex items-center justify-end space-x-1.5">
              <button type="button" class="btn-inv-preview p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100" data-id="${inv.id}" title="Preview / Print View">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
              <button type="button" class="btn-inv-pdf p-1.5 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-100" data-id="${inv.id}" title="Download PDF">
                <i data-lucide="download" class="w-4 h-4"></i>
              </button>
              <button type="button" class="btn-inv-print p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100" data-id="${inv.id}" title="Print Invoice">
                <i data-lucide="printer" class="w-4 h-4"></i>
              </button>
              <button type="button" class="btn-inv-edit p-1.5 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100" data-id="${inv.id}" title="Edit Invoice">
                <i data-lucide="pencil" class="w-4 h-4"></i>
              </button>
              <button type="button" class="btn-inv-copy p-1.5 text-slate-500 hover:text-amber-600 rounded hover:bg-slate-100" data-id="${inv.id}" title="Duplicate Invoice">
                <i data-lucide="copy" class="w-4 h-4"></i>
              </button>
              <button type="button" class="btn-inv-delete p-1.5 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50" data-id="${inv.id}" title="Delete Invoice">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.container.querySelectorAll('.inv-status-selector').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.value;
        this.app.invoices.updateStatus(id, newStatus);
        this.app.dashboard.render();
        this.render();
        this.app.showToast(`Invoice marked as ${newStatus.toUpperCase()}`, 'success');
      });
    });

    this.container.querySelectorAll('.btn-inv-preview').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const inv = this.app.invoices.getById(id);
        if (inv) this.app.printPdf.openPreviewModal(inv);
      });
    });

    this.container.querySelectorAll('.btn-inv-pdf').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const inv = this.app.invoices.getById(id);
        if (inv) this.app.printPdf.downloadPDF(inv);
      });
    });

    this.container.querySelectorAll('.btn-inv-print').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const inv = this.app.invoices.getById(id);
        if (inv) this.app.printPdf.print(inv);
      });
    });

    this.container.querySelectorAll('.btn-inv-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.app.invoices.loadForEdit(id);
      });
    });

    this.container.querySelectorAll('.btn-inv-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const dup = this.app.invoices.duplicateInvoice(id);
        if (dup) {
          this.app.showToast(`Duplicated as ${dup.invoiceNumber}`, 'success');
          this.app.dashboard.render();
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.btn-inv-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Are you sure you want to delete this invoice? This cannot be undone.')) {
          this.app.invoices.deleteInvoice(id);
          this.app.dashboard.render();
          this.render();
          this.app.showToast('Invoice deleted', 'info');
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }
}

// ============================================================================
// 9. APP COORDINATOR
// ============================================================================

class App {
  constructor() {
    this.currentView = 'dashboard';
    
    this.settings = new SettingsManager(this);
    this.customers = new CustomerManager(this);
    this.invoices = new InvoiceManager(this);
    this.calculator = new GSTCalculator(this);
    this.printPdf = new PrintPdfManager(this);
    this.dashboard = new DashboardManager(this);
    this.invoicesHistory = new InvoicesHistoryManager(this);
  }

  init() {
    this.setupNavigation();

    this.calculator.init();
    this.customers.init();
    this.settings.init();
    this.invoices.init();
    this.printPdf.init();
    this.dashboard.init();
    this.invoicesHistory.init();

    this.populateCustomerDropdowns();
    this.setupMobileMenu();
    this.setupKeyboardShortcuts();
    this.setupPWA();

    this.navigateTo('dashboard');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('[data-nav-target]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.dataset.navTarget;
        if (target) {
          this.navigateTo(target);
          this.closeMobileMenu();
        }
      });
    });

    const createInvBtns = document.querySelectorAll('.action-create-invoice');
    createInvBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.invoices.resetToNew();
        this.navigateTo('create-invoice');
        this.closeMobileMenu();
      });
    });

    const openCalcBtns = document.querySelectorAll('.action-open-calculator');
    openCalcBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigateTo('calculator');
        this.closeMobileMenu();
      });
    });

    const viewInvoicesBtns = document.querySelectorAll('.action-view-invoices');
    viewInvoicesBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigateTo('invoices');
        this.closeMobileMenu();
      });
    });
  }

  navigateTo(viewId) {
    this.currentView = viewId;

    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.add('hidden'));

    const targetEl = document.getElementById(`view-${viewId}`);
    if (targetEl) {
      targetEl.classList.remove('hidden');
    }

    const navItems = document.querySelectorAll('[data-nav-target]');
    navItems.forEach(item => {
      const isCurrent = item.dataset.navTarget === viewId;
      const isMobileNav = item.closest('#mobile-bottom-nav');

      if (isMobileNav) {
        if (isCurrent) {
          item.classList.add('text-blue-600');
          item.classList.remove('text-slate-500');
        } else {
          item.classList.remove('text-blue-600');
          item.classList.add('text-slate-500');
        }
      } else {
        if (isCurrent) {
          item.classList.add('bg-blue-50', 'text-blue-700', 'font-semibold');
          item.classList.remove('text-slate-600', 'hover:bg-slate-100');
        } else {
          item.classList.remove('bg-blue-50', 'text-blue-700', 'font-semibold');
          item.classList.add('text-slate-600', 'hover:bg-slate-100');
        }
      }
    });

    if (viewId === 'dashboard') {
      this.dashboard.render();
    } else if (viewId === 'invoices') {
      this.invoicesHistory.populateCustomerFilter();
      this.invoicesHistory.render();
    } else if (viewId === 'customers') {
      this.customers.render();
    } else if (viewId === 'settings') {
      this.settings.populateFormFields();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
  }

  populateCustomerDropdowns() {
    const custSelect = document.getElementById('inv-customer-select');
    if (!custSelect) return;

    const customers = this.customers.getAll();
    custSelect.innerHTML = `
      <option value="new">+ Enter New / Custom Customer</option>
      ${customers.map(c => `
        <option value="${c.id}">${escapeHTML(c.name)}${c.businessName ? ` (${escapeHTML(c.businessName)})` : ''}</option>
      `).join('')}
    `;

    if (this.invoicesHistory) {
      this.invoicesHistory.populateCustomerFilter();
    }
  }

  createNewInvoiceFromCalculator(calcData) {
    this.invoices.resetToNew();
    
    this.invoices.currentInvoice.items = [
      {
        id: 'calc-item-1',
        name: 'Goods / Services',
        hsn: '',
        qty: 1,
        unit: 'Pcs',
        rate: calcData.taxableAmount,
        discount: 0,
        discountType: 'flat',
        taxableAmount: calcData.taxableAmount,
        gstRate: calcData.gstRate,
        gstAmount: calcData.totalGST,
        total: calcData.grandTotal
      }
    ];

    this.invoices.currentInvoice.supplyType = calcData.supplyType;
    this.invoices.setSupplyTypeRadio(calcData.supplyType);

    this.invoices.renderItems();
    this.invoices.updateTotalsUI();

    this.navigateTo('create-invoice');
    this.showToast('Calculation transferred to new invoice!', 'success');
  }

  createNewInvoiceForCustomer(customer) {
    this.invoices.resetToNew();
    this.invoices.currentInvoice.customer = { ...customer };
    this.invoices.setCustomerFields(customer);
    this.navigateTo('create-invoice');
    this.showToast(`Started new invoice for ${customer.name}`, 'info');
  }

  resetToDemoData() {
    localStorage.removeItem('gst_invoice_settings');
    localStorage.removeItem('gst_invoice_customers');
    localStorage.removeItem('gst_invoice_invoices');
    this.showToast('Demo data restored! Refreshing...', 'success');
    setTimeout(() => window.location.reload(), 800);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const borderColors = {
      success: 'border-emerald-500 bg-white text-emerald-800',
      error: 'border-rose-500 bg-white text-rose-800',
      warning: 'border-amber-500 bg-white text-amber-800',
      info: 'border-blue-500 bg-white text-blue-800'
    };
    const iconNames = {
      success: 'check-circle-2',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    const styleClass = borderColors[type] || borderColors.info;
    const iconName = iconNames[type] || 'info';

    toast.className = `flex items-center space-x-3 px-4 py-3 rounded-lg border-l-4 shadow-lg text-xs font-semibold transform transition-all duration-300 translate-y-2 opacity-0 ${styleClass}`;
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i>
      <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  setupMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        if (backdrop) backdrop.classList.toggle('hidden');
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    }
  }

  closeMobileMenu() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar && window.innerWidth < 1024) {
      sidebar.classList.add('-translate-x-full');
    }
    if (backdrop) {
      backdrop.classList.add('hidden');
    }
  }

  setupPWA() {
    let deferredPrompt = null;
    const sidebarInstallBtn = document.getElementById('sidebar-install-btn');
    const headerInstallBtn = document.getElementById('header-install-btn');

    if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.log('ServiceWorker registration optional', err);
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (sidebarInstallBtn) {
        sidebarInstallBtn.classList.remove('hidden');
        sidebarInstallBtn.classList.add('flex');
      }
      if (headerInstallBtn) {
        headerInstallBtn.classList.remove('hidden');
        headerInstallBtn.classList.add('inline-flex');
      }
    });

    const triggerInstall = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          this.showToast('GST Invoice Pro installed!', 'success');
        }
        deferredPrompt = null;
        if (sidebarInstallBtn) sidebarInstallBtn.classList.add('hidden');
        if (headerInstallBtn) headerInstallBtn.classList.add('hidden');
      } else {
        this.showToast('You can install via your browser address bar or use the Desktop shortcut!', 'info');
      }
    };

    if (sidebarInstallBtn) sidebarInstallBtn.addEventListener('click', triggerInstall);
    if (headerInstallBtn) headerInstallBtn.addEventListener('click', triggerInstall);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        this.invoices.resetToNew();
        this.navigateTo('create-invoice');
      }
      if (e.key === 'Escape') {
        this.printPdf.closePreviewModal();
        this.customers.closeModal();
      }
    });
  }
}

// Global bootstrap
document.addEventListener('DOMContentLoaded', () => {
  window.gstApp = new App();
  window.gstApp.init();
});

/**
 * GST Invoice Pro - Invoice Model & Editor Module
 * Manages invoice creation, item calculations, totals, persistence, and state.
 */

import { 
  formatINR, 
  roundTo2, 
  numberToWordsINR, 
  validateGSTIN, 
  generateUUID, 
  toInputDate, 
  addDays, 
  INDIAN_STATES 
} from './utils.js';

export class InvoiceManager {
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
        supplyType: 'intra', // Intra-state (Karnataka to Karnataka)
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
        supplyType: 'inter', // Inter-state (Karnataka to Maharashtra)
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
        supplyType: 'inter', // Inter-state (Karnataka to Delhi)
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
      discountType: 'flat', // 'flat' (₹) | 'percentage' (%)
      taxableAmount: 0,
      gstRate: defaultRate,
      gstAmount: 0,
      total: 0
    };
  }

  /**
   * Recalculate an item row's amounts
   */
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

  /**
   * Recalculate entire invoice totals
   */
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

  /**
   * Setup UI listeners for Invoice Builder
   */
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
    // Add item row button
    if (this.addItemBtn) {
      this.addItemBtn.addEventListener('click', () => {
        const defRate = this.app.settings.get().defaultGstRate || 18;
        this.currentInvoice.items.push(this.createEmptyItem(defRate));
        this.renderItems();
        this.updateTotalsUI();
      });
    }

    // Customer Selection Dropdown
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

    // Customer GSTIN typed -> auto-detect state & supply type
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

    // Place of Supply Change -> auto check supply type
    if (this.placeOfSupplySelect) {
      this.placeOfSupplySelect.addEventListener('change', (e) => {
        this.currentInvoice.placeOfSupply = e.target.value;
        const opt = e.target.options[e.target.selectedIndex];
        this.currentInvoice.placeOfSupplyCode = opt ? opt.dataset.code : '';
        this.autoDetectSupplyType(e.target.value);
        this.updateTotalsUI();
      });
    }

    // Supply Type manual radio toggle
    this.supplyTypeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.currentInvoice.supplyType = e.target.value;
          this.updateTotalsUI();
        }
      });
    });

    // Save Invoice
    if (this.saveInvoiceBtn) {
      this.saveInvoiceBtn.addEventListener('click', () => {
        this.saveCurrentInvoice();
      });
    }

    // Preview
    if (this.previewInvoiceBtn) {
      this.previewInvoiceBtn.addEventListener('click', () => {
        const inv = this.gatherInvoiceData();
        if (this.validateInvoice(inv)) {
          this.app.printPdf.openPreviewModal(inv);
        }
      });
    }

    // Print
    if (this.printInvoiceBtn) {
      this.printInvoiceBtn.addEventListener('click', () => {
        const inv = this.gatherInvoiceData();
        if (this.validateInvoice(inv)) {
          this.app.printPdf.print(inv);
        }
      });
    }

    // Download PDF
    if (this.downloadPdfBtn) {
      this.downloadPdfBtn.addEventListener('click', () => {
        const inv = this.gatherInvoiceData();
        if (this.validateInvoice(inv)) {
          this.app.printPdf.downloadPDF(inv);
        }
      });
    }

    // Reset Form
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

    // If customer matches an existing one in select
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
      tr.className = 'border-b border-gray-100 hover:bg-gray-50/60 transition-colors item-row';
      tr.dataset.index = index;

      tr.innerHTML = `
        <td class="py-3 px-2 text-center text-xs font-semibold text-gray-500">${index + 1}</td>
        <td class="py-3 px-2">
          <input type="text" class="item-name-input w-full text-xs font-medium border border-gray-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder="Product / Service description" value="${item.name || ''}" required>
        </td>
        <td class="py-3 px-2">
          <input type="text" class="item-hsn-input w-24 text-xs font-mono border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder="HSN/SAC" value="${item.hsn || ''}">
        </td>
        <td class="py-3 px-2">
          <div class="flex items-center space-x-1">
            <input type="number" step="0.01" min="0.01" class="item-qty-input w-16 text-xs text-right border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500" value="${item.qty || 1}">
            <select class="item-unit-select text-xs border border-gray-200 rounded px-1.5 py-1.5 bg-white text-gray-700">
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
            <span class="absolute left-2 top-2 text-xs text-gray-400">₹</span>
            <input type="number" step="0.01" min="0" class="item-rate-input w-24 text-xs text-right border border-gray-200 rounded pl-5 pr-2 py-1.5 focus:ring-1 focus:ring-blue-500" placeholder="0.00" value="${item.rate || 0}">
          </div>
        </td>
        <td class="py-3 px-2">
          <div class="flex items-center space-x-1">
            <input type="number" step="0.01" min="0" class="item-discount-input w-16 text-xs text-right border border-gray-200 rounded px-1.5 py-1.5 focus:ring-1 focus:ring-blue-500" placeholder="0" value="${item.discount || 0}">
            <select class="item-discount-type-select text-xs border border-gray-200 rounded px-1 py-1.5 bg-white text-gray-700">
              <option value="flat" ${item.discountType === 'flat' ? 'selected' : ''}>₹</option>
              <option value="percentage" ${item.discountType === 'percentage' ? 'selected' : ''}>%</option>
            </select>
          </div>
        </td>
        <td class="py-3 px-2 text-right text-xs font-semibold text-gray-800 item-taxable-display">
          ${formatINR(calculated.taxableAmount)}
        </td>
        <td class="py-3 px-2">
          <select class="item-gst-select text-xs border border-gray-200 rounded px-2 py-1.5 bg-white font-medium text-gray-800">
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
        <td class="py-3 px-2 text-right text-xs font-bold text-gray-900 item-total-display">
          ${formatINR(calculated.total)}
        </td>
        <td class="py-3 px-2 text-center">
          <div class="flex items-center justify-center space-x-1">
            <button type="button" class="btn-clone-item text-gray-400 hover:text-blue-600 p-1" title="Duplicate row">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" class="btn-remove-item text-gray-400 hover:text-red-600 p-1" title="Delete row">
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

    // Clone row
    row.querySelector('.btn-clone-item').addEventListener('click', () => {
      const cloned = JSON.parse(JSON.stringify(item));
      cloned.id = generateUUID();
      this.currentInvoice.items.splice(index + 1, 0, cloned);
      this.renderItems();
      this.updateTotalsUI();
    });

    // Remove row
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

    // Perform full calculations
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

    // Optionally auto-add customer to directory if not present
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

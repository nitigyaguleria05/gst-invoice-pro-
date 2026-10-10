/**
 * GST Invoice Pro - Settings Module
 * Business Profile, Bank Details, Default GST/Invoice settings, Data Backup/Restore
 */

import { INDIAN_STATES, validateGSTIN } from './utils.js';

export class SettingsManager {
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
      logoUrl: '', // Base64 data URL

      // Bank Details
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200012345678',
      accountHolder: 'Apex Infotech Solutions Pvt Ltd',
      ifscCode: 'HDFC0000128',
      branch: 'Whitefield Branch, Bangalore',
      upiId: 'apexinfotech@okhdfcbank',

      // Invoice Defaults
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

    // Logo file reader
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

    // Auto-fill state and PAN from GSTIN
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

    // Export Data JSON
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => {
        this.exportAllData();
      });
    }

    // Import Data JSON
    if (this.importInput) {
      this.importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.importAllData(file);
        }
      });
    }

    // Reset to Demo Data
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

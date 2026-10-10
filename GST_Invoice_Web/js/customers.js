/**
 * GST Invoice Pro - Customer Management Module
 * Store, Add, Edit, Delete, and Search Customers
 */

import { generateUUID, validateGSTIN, escapeHTML, INDIAN_STATES } from './utils.js';

export class CustomerManager {
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

    // Auto-detect state if GSTIN is typed in customer form
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
        <div class="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="users" class="w-8 h-8"></i>
          </div>
          <h3 class="text-base font-semibold text-gray-900 mb-1">No customers found</h3>
          <p class="text-sm text-gray-500 mb-4">Add your frequent clients to quickly generate invoices with one click.</p>
          <button type="button" class="btn-primary inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700" onclick="window.gstApp.customers.openModal()">
            <i data-lucide="user-plus" class="w-4 h-4 mr-2"></i> Add Customer
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    this.container.innerHTML = filtered.map(c => `
      <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                ${escapeHTML(c.name.charAt(0).toUpperCase())}
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 text-base leading-tight">${escapeHTML(c.name)}</h4>
                ${c.businessName ? `<p class="text-xs text-gray-500 font-medium">${escapeHTML(c.businessName)}</p>` : ''}
              </div>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.gstin ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'}">
              ${c.gstin ? 'GST Registered' : 'Unregistered'}
            </span>
          </div>

          <div class="space-y-1.5 text-xs text-gray-600 mb-4 border-t border-gray-100 pt-3">
            ${c.gstin ? `<div class="flex items-center"><span class="font-mono text-gray-800 font-semibold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">${escapeHTML(c.gstin)}</span></div>` : ''}
            ${c.phone ? `<div class="flex items-center space-x-2"><i data-lucide="phone" class="w-3.5 h-3.5 text-gray-400"></i><span>${escapeHTML(c.phone)}</span></div>` : ''}
            ${c.email ? `<div class="flex items-center space-x-2"><i data-lucide="mail" class="w-3.5 h-3.5 text-gray-400"></i><span class="truncate">${escapeHTML(c.email)}</span></div>` : ''}
            ${(c.city || c.state) ? `<div class="flex items-center space-x-2"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-gray-400"></i><span>${escapeHTML([c.city, c.state].filter(Boolean).join(', '))}</span></div>` : ''}
          </div>
        </div>

        <div class="border-t border-gray-100 pt-3 flex items-center justify-between gap-2">
          <button type="button" class="btn-create-invoice-for-cust inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800" data-id="${c.id}">
            <i data-lucide="file-plus" class="w-3.5 h-3.5 mr-1"></i> New Invoice
          </button>
          <div class="flex items-center space-x-2">
            <button type="button" class="btn-edit-cust p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100" data-id="${c.id}" title="Edit Customer">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" class="btn-delete-cust p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-red-50" data-id="${c.id}" title="Delete Customer">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach card event listeners
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

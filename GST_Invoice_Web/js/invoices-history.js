/**
 * GST Invoice Pro - Invoices History Module
 * Filter, search, duplicate, edit, delete, preview, and download past invoices
 */

import { formatINR, formatDate, escapeHTML } from './utils.js';

export class InvoicesHistoryManager {
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

    // Apply Search
    if (this.filters.search) {
      const q = this.filters.search;
      invoices = invoices.filter(inv => 
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
        (inv.customer.name && inv.customer.name.toLowerCase().includes(q)) ||
        (inv.customer.businessName && inv.customer.businessName.toLowerCase().includes(q)) ||
        (inv.customer.gstin && inv.customer.gstin.toLowerCase().includes(q))
      );
    }

    // Apply Status Filter
    if (this.filters.status !== 'all') {
      invoices = invoices.filter(inv => inv.status === this.filters.status);
    }

    // Apply Customer Filter
    if (this.filters.customer !== 'all') {
      invoices = invoices.filter(inv => inv.customer.id === this.filters.customer);
    }

    // Apply Date Range Filter
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
          <td colspan="7" class="text-center py-12 text-gray-500 bg-white">
            <div class="max-w-xs mx-auto text-center">
              <i data-lucide="file-x" class="w-10 h-10 text-gray-400 mx-auto mb-2"></i>
              <p class="font-semibold text-gray-800 text-sm">No matching invoices found</p>
              <p class="text-xs text-gray-500 mt-1">Try resetting the filters or create a new invoice.</p>
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
        draft: 'bg-gray-100 text-gray-600 border-gray-200'
      };
      const colorClass = statusColors[inv.status] || statusColors.pending;

      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
          <td class="py-3 px-4 text-xs font-mono font-bold text-blue-900">
            ${escapeHTML(inv.invoiceNumber)}
          </td>
          <td class="py-3 px-4 text-xs">
            <div class="font-semibold text-gray-900">${escapeHTML(inv.customer.name)}</div>
            ${inv.customer.businessName ? `<div class="text-[11px] text-gray-500 font-medium">${escapeHTML(inv.customer.businessName)}</div>` : ''}
            ${inv.customer.gstin ? `<div class="text-[10px] font-mono text-gray-600">${escapeHTML(inv.customer.gstin)}</div>` : ''}
          </td>
          <td class="py-3 px-4 text-xs text-gray-600">
            <div>${formatDate(inv.invoiceDate)}</div>
            <div class="text-[10px] text-gray-400">Due: ${formatDate(inv.dueDate)}</div>
          </td>
          <td class="py-3 px-4 text-xs text-right">
            <div class="font-bold text-gray-900">${formatINR(inv.grandTotal)}</div>
            <div class="text-[10px] text-gray-500">GST: ${formatINR(inv.totalGST)}</div>
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
              <button type="button" class="btn-inv-preview p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100" data-id="${inv.id}" title="Preview / Print View">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
              <button type="button" class="btn-inv-pdf p-1.5 text-gray-500 hover:text-emerald-600 rounded hover:bg-gray-100" data-id="${inv.id}" title="Download PDF">
                <i data-lucide="download" class="w-4 h-4"></i>
              </button>
              <button type="button" class="btn-inv-print p-1.5 text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100" data-id="${inv.id}" title="Print Invoice">
                <i data-lucide="printer" class="w-4 h-4"></i>
              </button>
              <button type="button" class="btn-inv-edit p-1.5 text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100" data-id="${inv.id}" title="Edit Invoice">
                <i data-lucide="pencil" class="w-4 h-4"></i>
              </button>
              <button type="button" class="btn-inv-copy p-1.5 text-gray-500 hover:text-amber-600 rounded hover:bg-gray-100" data-id="${inv.id}" title="Duplicate Invoice">
                <i data-lucide="copy" class="w-4 h-4"></i>
              </button>
              <button type="button" class="btn-inv-delete p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-red-50" data-id="${inv.id}" title="Delete Invoice">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Event Handlers
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

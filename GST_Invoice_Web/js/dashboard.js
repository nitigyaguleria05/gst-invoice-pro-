/**
 * GST Invoice Pro - Dashboard Module
 * Analytics KPIs, revenue & GST stats, recent invoices, and quick action cards
 */

import { formatINR, formatDate, escapeHTML } from './utils.js';

export class DashboardManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    this.container = document.getElementById('dashboard-view');
    this.render();
  }

  render() {
    if (!this.container) return;

    const stats = this.app.invoices.getDashboardStats();

    // Update KPI numbers
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText('dash-total-sales', formatINR(stats.totalSales));
    setText('dash-total-gst', formatINR(stats.totalGST));
    setText('dash-pending-payments', formatINR(stats.pendingAmount));
    setText('dash-paid-count', `${stats.paidCount} / ${stats.totalInvoices}`);
    setText('dash-total-invoices', stats.totalInvoices);

    // Render Recent Invoices Table
    const tableBody = document.getElementById('dash-recent-invoices-body');
    if (tableBody) {
      if (stats.recentInvoices.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-8 text-gray-500 text-sm">
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
            draft: 'bg-gray-100 text-gray-600 border-gray-200'
          };
          const colorClass = statusColors[inv.status] || statusColors.pending;

          return `
            <tr class="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
              <td class="py-3 px-4 text-xs font-mono font-bold text-gray-900">
                ${escapeHTML(inv.invoiceNumber)}
              </td>
              <td class="py-3 px-4 text-xs">
                <span class="font-semibold text-gray-900 block">${escapeHTML(inv.customer.name)}</span>
                ${inv.customer.businessName ? `<span class="text-gray-500 text-[11px] block">${escapeHTML(inv.customer.businessName)}</span>` : ''}
              </td>
              <td class="py-3 px-4 text-xs text-gray-600">
                ${formatDate(inv.invoiceDate)}
              </td>
              <td class="py-3 px-4 text-xs font-bold text-gray-900 text-right">
                ${formatINR(inv.grandTotal)}
              </td>
              <td class="py-3 px-4 text-xs text-center">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase border ${colorClass}">
                  ${escapeHTML(inv.status)}
                </span>
              </td>
              <td class="py-3 px-4 text-xs text-right">
                <div class="flex items-center justify-end space-x-1">
                  <button type="button" class="btn-dash-preview p-1 text-gray-500 hover:text-blue-600 rounded" data-id="${inv.id}" title="Preview Invoice">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                  <button type="button" class="btn-dash-pdf p-1 text-gray-500 hover:text-emerald-600 rounded" data-id="${inv.id}" title="Download PDF">
                    <i data-lucide="download" class="w-4 h-4"></i>
                  </button>
                  <button type="button" class="btn-dash-edit p-1 text-gray-500 hover:text-indigo-600 rounded" data-id="${inv.id}" title="Edit Invoice">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

        // Attach action handlers
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

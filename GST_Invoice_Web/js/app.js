/**
 * GST Invoice Pro - Application Coordinator
 * State synchronization, navigation router, toasts, shortcuts, and modular bootstrapping
 */

import { GSTCalculator } from './calculator.js';
import { CustomerManager } from './customers.js';
import { SettingsManager } from './settings.js';
import { InvoiceManager } from './invoice.js';
import { PrintPdfManager } from './print-pdf.js';
import { DashboardManager } from './dashboard.js';
import { InvoicesHistoryManager } from './invoices-history.js';

class App {
  constructor() {
    this.currentView = 'dashboard';
    
    // Initialize Subsystems
    this.settings = new SettingsManager(this);
    this.customers = new CustomerManager(this);
    this.invoices = new InvoiceManager(this);
    this.calculator = new GSTCalculator(this);
    this.printPdf = new PrintPdfManager(this);
    this.dashboard = new DashboardManager(this);
    this.invoicesHistory = new InvoicesHistoryManager(this);
  }

  init() {
    // Setup Navigation Handlers
    this.setupNavigation();

    // Initialize UI components
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

    // Default to dashboard view
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

    // Quick action buttons in Dashboard and Header
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

    // Hide all view sections
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.add('hidden'));

    // Show target view
    const targetEl = document.getElementById(`view-${viewId}`);
    if (targetEl) {
      targetEl.classList.remove('hidden');
    }

    // Update active state on navigation items
    const navItems = document.querySelectorAll('[data-nav-target]');
    navItems.forEach(item => {
      const isCurrent = item.dataset.navTarget === viewId;
      if (isCurrent) {
        item.classList.add('bg-blue-50', 'text-blue-700', 'font-semibold');
        item.classList.remove('text-gray-600', 'hover:bg-gray-100');
      } else {
        item.classList.remove('bg-blue-50', 'text-blue-700', 'font-semibold');
        item.classList.add('text-gray-600', 'hover:bg-gray-100');
      }
    });

    // View-specific re-renders
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
    
    // Fill in item row from calculation
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

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    // Auto remove after 3.5 seconds
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

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + N -> New Invoice
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        this.invoices.resetToNew();
        this.navigateTo('create-invoice');
      }
      // Escape -> close preview or customer modal
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

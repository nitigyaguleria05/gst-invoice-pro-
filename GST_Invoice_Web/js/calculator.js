/**
 * GST Invoice Pro - GST Calculator Module
 * Real-time GST calculations, exclusive/inclusive modes, intra/inter-state split
 */

import { formatINR, roundTo2 } from './utils.js';

export class GSTCalculator {
  constructor(app) {
    this.app = app;
    this.state = {
      amount: 10000,
      rate: 18,
      isCustomRate: false,
      calculationType: 'exclusive', // 'exclusive' | 'inclusive'
      supplyType: 'intra' // 'intra' (CGST+SGST) | 'inter' (IGST)
    };
  }

  /**
   * Pure calculation engine: takes state inputs and returns exact figures
   */
  static calculate({ amount, rate, calculationType, supplyType }) {
    const rawAmount = Math.max(0, Number(amount) || 0);
    const gstRate = Math.max(0, Number(rate) || 0);
    
    let taxableAmount = 0;
    let totalGST = 0;
    let grandTotal = 0;

    if (calculationType === 'exclusive') {
      // Amount is taxable amount
      taxableAmount = roundTo2(rawAmount);
      totalGST = roundTo2(taxableAmount * (gstRate / 100));
      grandTotal = roundTo2(taxableAmount + totalGST);
    } else {
      // Amount is gross (inclusive of GST)
      grandTotal = roundTo2(rawAmount);
      taxableAmount = roundTo2(grandTotal / (1 + gstRate / 100));
      totalGST = roundTo2(grandTotal - taxableAmount);
    }

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (supplyType === 'intra') {
      // Intra-state split 50/50
      cgst = roundTo2(totalGST / 2);
      // Ensure sgst + cgst strictly equals totalGST to eliminate floating penny discrepancies
      sgst = roundTo2(totalGST - cgst);
      igst = 0;
    } else {
      // Inter-state
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

  /**
   * Initialize DOM event listeners
   */
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

    // Listen to amount changes
    this.amountInput.addEventListener('input', (e) => {
      this.state.amount = parseFloat(e.target.value) || 0;
      this.render();
    });

    // Listen to calculation type toggle (exclusive / inclusive)
    this.calcTypeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.state.calculationType = e.target.value;
          this.render();
        }
      });
    });

    // Listen to supply type toggle (intra / inter)
    this.supplyTypeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.state.supplyType = e.target.value;
          this.render();
        }
      });
    });

    // Listen to rate preset buttons
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

    // Custom rate input
    if (this.customRateInput) {
      this.customRateInput.addEventListener('input', (e) => {
        if (this.state.isCustomRate) {
          this.state.rate = parseFloat(e.target.value) || 0;
          this.render();
        }
      });
    }

    // Quick Action: Send calculation directly to new invoice
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

    // Copy breakdown to clipboard
    if (this.copyBreakdownBtn) {
      this.copyBreakdownBtn.addEventListener('click', () => {
        this.copyBreakdownText();
      });
    }

    // Initial render
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
        btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-200', 'hover:bg-gray-50');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600', 'shadow-sm');
        btn.classList.add('bg-white', 'text-gray-700', 'border-gray-200', 'hover:bg-gray-50');
      }
    });
  }

  render() {
    const result = GSTCalculator.calculate(this.state);

    // Update display values
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText('calc-taxable-display', formatINR(result.taxableAmount));
    setText('calc-total-gst-display', formatINR(result.totalGST));
    setText('calc-grand-total-display', formatINR(result.grandTotal));
    setText('calc-rate-badge', `${result.rate}%`);

    // Intra vs Inter display handling
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

    // Formula & Explanation Text
    const formulaEl = document.getElementById('calc-formula-text');
    if (formulaEl) {
      if (result.calculationType === 'exclusive') {
        formulaEl.innerHTML = `GST = Taxable Amount (₹${result.taxableAmount.toLocaleString('en-IN')}) × ${result.rate}% = <strong class="text-blue-700">₹${result.totalGST.toLocaleString('en-IN')}</strong>.<br/>Grand Total = Taxable Amount + GST = <strong class="text-gray-900">₹${result.grandTotal.toLocaleString('en-IN')}</strong>.`;
      } else {
        formulaEl.innerHTML = `Taxable Amount = Total (₹${result.grandTotal.toLocaleString('en-IN')}) ÷ (1 + ${result.rate} ÷ 100) = <strong class="text-blue-700">₹${result.taxableAmount.toLocaleString('en-IN')}</strong>.<br/>GST = Total - Taxable Amount = <strong class="text-gray-900">₹${result.totalGST.toLocaleString('en-IN')}</strong>.`;
      }
    }

    // Update Comparison Table for all major slabs (0%, 5%, 12%, 18%, 28%)
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
        <tr class="border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${isCurrent ? 'bg-blue-50 font-semibold' : ''}">
          <td class="py-2.5 px-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}">
              ${r}% GST
            </span>
          </td>
          <td class="py-2.5 px-3 text-right text-gray-700">${formatINR(res.taxableAmount)}</td>
          <td class="py-2.5 px-3 text-right text-blue-600">${formatINR(res.totalGST)}</td>
          <td class="py-2.5 px-3 text-right text-gray-900 font-bold">${formatINR(res.grandTotal)}</td>
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

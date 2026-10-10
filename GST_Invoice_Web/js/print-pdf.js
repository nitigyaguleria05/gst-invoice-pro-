/**
 * GST Invoice Pro - Print & PDF Generation Module
 * Formats high-fidelity A4 Indian Tax Invoices with UPI QR code, HSN summary, and print/export handlers
 */

import { formatINR, escapeHTML, formatDate } from './utils.js';

export class PrintPdfManager {
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
      
      // Allow slight delay for QR code and images to paint
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }

  async downloadPDF(invoice) {
    const settings = this.app.settings.get();
    const html = this.generateInvoiceHTML(invoice, settings);

    // Create a temporary off-screen container for crisp rendering
    const tempContainer = document.createElement('div');
    tempContainer.className = 'pdf-render-container';
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '0';
    tempContainer.style.width = '210mm'; // Standard A4 width
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.innerHTML = html;
    document.body.appendChild(tempContainer);

    this.generateUPIQRCode(invoice, settings, 'temp-upi-qrcode', tempContainer);

    this.app.showToast('Generating PDF, please wait...', 'info');

    const opt = {
      margin: [10, 10, 10, 10], // mm
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
        // Fallback to window.print if html2pdf is unavailable
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

    // Standard UPI Payment URI
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

  /**
   * Generates HSN Summary table rows
   */
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
          <tr class="border-b border-gray-200 text-xs">
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
          <tr class="border-b border-gray-200 text-xs">
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

  /**
   * Generates standard A4 Indian Tax Invoice HTML
   */
  generateInvoiceHTML(invoice, settings) {
    const isIntra = invoice.supplyType === 'intra';
    const cust = invoice.customer || {};

    const itemsRows = invoice.items.map((it, idx) => `
      <tr class="border-b border-gray-200 text-xs leading-relaxed">
        <td class="py-2 px-2 text-center text-gray-500 font-medium">${idx + 1}</td>
        <td class="py-2 px-2 font-semibold text-gray-900">${escapeHTML(it.name)}</td>
        <td class="py-2 px-2 text-center font-mono text-gray-600">${escapeHTML(it.hsn || '-')}</td>
        <td class="py-2 px-2 text-right text-gray-800">${it.qty} ${escapeHTML(it.unit || '')}</td>
        <td class="py-2 px-2 text-right text-gray-800">${formatINR(it.rate)}</td>
        <td class="py-2 px-2 text-right text-gray-500">${it.discount ? (it.discountType === 'percentage' ? `${it.discount}%` : formatINR(it.discount)) : '-'}</td>
        <td class="py-2 px-2 text-right font-medium text-gray-900">${formatINR(it.taxableAmount)}</td>
        <td class="py-2 px-2 text-right text-gray-700">${it.gstRate}%</td>
        <td class="py-2 px-2 text-right text-gray-700">${formatINR(it.gstAmount)}</td>
        <td class="py-2 px-2 text-right font-bold text-gray-900">${formatINR(it.total)}</td>
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
      <div class="a4-invoice-sheet bg-white text-gray-900 p-8 max-w-[210mm] mx-auto border border-gray-300 shadow-sm print:shadow-none print:border-none print:p-0 font-sans">
        
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
                <h1 class="text-xl font-bold text-gray-900 tracking-tight">${escapeHTML(settings.businessName)}</h1>
                ${settings.tradeName ? `<p class="text-xs text-blue-700 font-semibold uppercase tracking-wider">${escapeHTML(settings.tradeName)}</p>` : ''}
                <p class="text-xs text-gray-600 mt-0.5">${escapeHTML(settings.address)}, ${escapeHTML(settings.city)} - ${escapeHTML(settings.pincode)}</p>
                <div class="flex items-center space-x-3 text-xs text-gray-700 font-medium mt-1">
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
              <p class="text-[10px] text-gray-500 font-medium">Original for Recipient</p>
              <div class="mt-2 text-xs text-gray-600">
                <p><span class="font-semibold text-gray-800">Invoice No:</span> <span class="font-mono font-bold text-gray-900">${escapeHTML(invoice.invoiceNumber)}</span></p>
                <p><span class="font-semibold text-gray-800">Date:</span> ${formatDate(invoice.invoiceDate)}</p>
                <p><span class="font-semibold text-gray-800">Due Date:</span> ${formatDate(invoice.dueDate)}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Details Grid: Bill To & Supply Metadata -->
        <div class="grid grid-cols-2 gap-4 border border-gray-300 rounded-lg p-3 text-xs mb-4 bg-gray-50/50">
          <div>
            <h3 class="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1.5 pb-1 border-b border-gray-200">
              Details of Receiver / Billed To:
            </h3>
            <p class="font-bold text-sm text-gray-900">${escapeHTML(cust.name)}</p>
            ${cust.businessName ? `<p class="font-semibold text-gray-700">${escapeHTML(cust.businessName)}</p>` : ''}
            <p class="text-gray-600 mt-0.5">${escapeHTML(cust.address || 'Address not provided')}</p>
            <p class="text-gray-600">${escapeHTML(cust.city || '')} ${cust.state ? `- ${escapeHTML(cust.state)}` : ''}</p>
            <div class="mt-1.5 pt-1.5 border-t border-gray-200/70 space-y-0.5">
              <p><strong class="text-gray-800">GSTIN / UIN:</strong> <span class="font-mono font-semibold">${escapeHTML(cust.gstin || 'Unregistered')}</span></p>
              <p><strong class="text-gray-800">State:</strong> ${escapeHTML(cust.state || '-')} (Code: ${escapeHTML(cust.stateCode || '-')})</p>
              ${cust.phone ? `<p><strong class="text-gray-800">Phone:</strong> ${escapeHTML(cust.phone)}</p>` : ''}
            </div>
          </div>

          <div>
            <h3 class="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1.5 pb-1 border-b border-gray-200">
              Invoice & Supply Information:
            </h3>
            <div class="space-y-1">
              <div class="flex justify-between"><span class="text-gray-600">Place of Supply:</span> <span class="font-semibold text-gray-800">${escapeHTML(invoice.placeOfSupply)} (${escapeHTML(invoice.placeOfSupplyCode)})</span></div>
              <div class="flex justify-between"><span class="text-gray-600">Supply Type:</span> <span class="font-semibold text-blue-700 uppercase">${isIntra ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}</span></div>
              <div class="flex justify-between"><span class="text-gray-600">Reverse Charge:</span> <span class="font-semibold text-gray-800">${escapeHTML(invoice.reverseCharge)}</span></div>
              <div class="flex justify-between"><span class="text-gray-600">Payment Status:</span> <span class="font-bold uppercase ${invoice.status === 'paid' ? 'text-emerald-700' : (invoice.status === 'overdue' ? 'text-red-700' : 'text-amber-700')}">${escapeHTML(invoice.status)}</span></div>
              <div class="flex justify-between"><span class="text-gray-600">Payment Method:</span> <span class="font-medium text-gray-800">${escapeHTML(invoice.paymentMethod || 'Bank Transfer')}</span></div>
            </div>
          </div>
        </div>

        <!-- Product / Service Items Table -->
        <table class="w-full border-collapse border border-gray-300 mb-4">
          <thead>
            <tr class="bg-gray-100 text-gray-700 text-[11px] uppercase tracking-wider border-b border-gray-300">
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
          <tbody class="divide-y divide-gray-200">
            ${itemsRows}
          </tbody>
        </table>

        <!-- Amount In Words & Totals Summary Split -->
        <div class="grid grid-cols-12 gap-4 mb-4">
          <!-- Left: Amount in words & HSN Breakdown -->
          <div class="col-span-7 flex flex-col justify-between">
            <div>
              <div class="border border-gray-300 rounded p-2.5 bg-blue-50/30 text-xs mb-3">
                <span class="text-gray-500 font-semibold block text-[10px] uppercase tracking-wider">Total Amount in Words:</span>
                <p class="font-bold text-gray-900 mt-0.5 italic leading-tight">${escapeHTML(invoice.amountInWords)}</p>
              </div>

              <!-- HSN Summary Table -->
              <div class="border border-gray-300 rounded overflow-hidden">
                <div class="bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase text-gray-700">
                  GST Tax Breakdown by HSN/SAC
                </div>
                <table class="w-full text-[11px]">
                  <thead class="bg-gray-50 text-[10px] text-gray-600 border-b border-gray-200">
                    <tr>${hsnHeaders}</tr>
                  </thead>
                  <tbody>
                    ${hsnRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Right: Summary Table -->
          <div class="col-span-5">
            <div class="border border-gray-300 rounded bg-gray-50/50 p-3 text-xs space-y-2">
              <div class="flex justify-between text-gray-600">
                <span>Subtotal (Gross):</span>
                <span class="font-medium text-gray-800">${formatINR(invoice.subtotal)}</span>
              </div>
              ${invoice.totalDiscount > 0 ? `
                <div class="flex justify-between text-gray-600">
                  <span>Total Discount:</span>
                  <span class="text-red-600 font-medium">-${formatINR(invoice.totalDiscount)}</span>
                </div>
              ` : ''}
              <div class="flex justify-between text-gray-800 font-semibold border-t border-gray-200 pt-1.5">
                <span>Total Taxable Value:</span>
                <span>${formatINR(invoice.taxableValue)}</span>
              </div>

              ${isIntra ? `
                <div class="flex justify-between text-gray-600">
                  <span>CGST Total:</span>
                  <span class="font-medium text-gray-800">${formatINR(invoice.cgst)}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                  <span>SGST Total:</span>
                  <span class="font-medium text-gray-800">${formatINR(invoice.sgst)}</span>
                </div>
              ` : `
                <div class="flex justify-between text-gray-600">
                  <span>IGST Total:</span>
                  <span class="font-medium text-gray-800">${formatINR(invoice.igst)}</span>
                </div>
              `}

              <div class="flex justify-between text-blue-700 font-medium">
                <span>Total GST Amount:</span>
                <span>${formatINR(invoice.totalGST)}</span>
              </div>

              ${invoice.roundOff !== 0 ? `
                <div class="flex justify-between text-gray-500 text-[11px]">
                  <span>Round Off:</span>
                  <span>${invoice.roundOff > 0 ? '+' : ''}${formatINR(invoice.roundOff, false)}</span>
                </div>
              ` : ''}

              <div class="flex justify-between items-center text-sm font-bold text-gray-900 border-t-2 border-gray-800 pt-2 bg-blue-50/60 p-2 rounded">
                <span>Grand Total:</span>
                <span class="text-base text-blue-900">${formatINR(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bank Details, UPI QR Code, & Signatory Block -->
        <div class="border border-gray-300 rounded-lg p-3 text-xs mb-3 bg-gray-50/30">
          <div class="grid grid-cols-12 gap-4 items-center">
            <!-- Bank info -->
            <div class="col-span-5 border-r border-gray-200 pr-3">
              <h4 class="font-bold text-blue-900 uppercase text-[10px] tracking-wider mb-1">Bank Payment Details:</h4>
              <p><strong class="text-gray-700">Bank:</strong> ${escapeHTML(settings.bankName)}</p>
              <p><strong class="text-gray-700">A/C Number:</strong> <span class="font-mono font-bold">${escapeHTML(settings.accountNumber)}</span></p>
              <p><strong class="text-gray-700">Account Name:</strong> ${escapeHTML(settings.accountHolder)}</p>
              <p><strong class="text-gray-700">IFSC Code:</strong> <span class="font-mono font-bold">${escapeHTML(settings.ifscCode)}</span></p>
              ${settings.branch ? `<p><strong class="text-gray-700">Branch:</strong> ${escapeHTML(settings.branch)}</p>` : ''}
            </div>

            <!-- UPI QR -->
            <div class="col-span-3 flex flex-col items-center justify-center border-r border-gray-200 pr-3">
              ${settings.upiId ? `
                <div id="${this.activeInvoice ? 'modal-upi-qrcode' : 'print-upi-qrcode'}" class="p-1 bg-white border border-gray-300 rounded"></div>
                <span class="text-[9px] text-gray-500 font-semibold mt-1">Scan & Pay via UPI</span>
                <span class="text-[9px] text-blue-600 font-mono">${escapeHTML(settings.upiId)}</span>
              ` : `
                <span class="text-xs text-gray-400 italic">No UPI ID configured</span>
              `}
            </div>

            <!-- Signature block -->
            <div class="col-span-4 text-center flex flex-col justify-between h-full pt-1">
              <div>
                <p class="text-[10px] text-gray-500 font-semibold">For <span class="text-gray-900 font-bold">${escapeHTML(settings.businessName)}</span></p>
              </div>
              <div class="mt-8 border-t border-gray-400 mx-6 pt-1">
                <p class="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer: Terms & Notes -->
        <div class="text-[10px] text-gray-500 space-y-1 border-t border-gray-200 pt-2">
          ${invoice.paymentTerms ? `<p><strong>Terms & Conditions:</strong> ${escapeHTML(invoice.paymentTerms)}</p>` : ''}
          ${invoice.notes ? `<p><strong>Notes:</strong> ${escapeHTML(invoice.notes)}</p>` : ''}
          <p class="italic text-gray-400 text-center pt-1">${escapeHTML(settings.declaration || 'This is a computer generated invoice.')}</p>
        </div>

      </div>
    `;
  }
}

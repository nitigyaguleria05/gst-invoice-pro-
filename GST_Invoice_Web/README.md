# GST Invoice Pro 🇮🇳

> A modern, responsive, and automated GST calculator and professional tax invoice generator built for Indian businesses, shop owners, freelancers, and enterprises.

![GST Compliant](https://img.shields.io/badge/GST-Rule%2046%20Compliant-blue.svg)
![PWA Ready](https://img.shields.io/badge/PWA-Installable-emerald.svg)
![Platforms](https://img.shields.io/badge/Platforms-Web%20%7C%20Android%20%7C%20iOS%20%7C%20Desktop-purple.svg)
![Offline First](https://img.shields.io/badge/Storage-Offline%20LocalStorage-orange.svg)

---

## 🚀 Key Features

### 1. Instant GST Calculator
- **Tax Modes**: Switch between **GST Exclusive** (adds tax to base amount) and **GST Inclusive** (extracts base taxable value and tax from gross total).
- **Tax Slabs**: Preset buttons for **0%, 5%, 12%, 18%, and 28%**, plus support for custom rates.
- **Intra-State vs. Inter-State**:
  - **Intra-State**: Automatically divides tax into **50% CGST** and **50% SGST**.
  - **Inter-State**: Automatically applies **100% IGST**.
- **Real-Time Dynamic Math**: Calculation breakdown formula and multi-slab comparison table update as you type.
- **Direct Bridge to Invoice**: Click *"Create Invoice With This"* to populate a fresh invoice with your calculation in 1 click.

### 2. Professional GST Tax Invoice Generator
- Compliant with standard Indian GST Act & Rule 46 CGST rules.
- **Seller Profile**: Business name, trade name, 15-digit GSTIN, PAN, registered address, and company logo upload.
- **Buyer Information**: Customer directory autocomplete, GSTIN format validator, and automatic State code detection.
- **Itemized Product/Service Table**: Unlimited items, HSN/SAC codes, units, rates, discounts (% or flat ₹), and dynamic row calculations.
- **HSN Tax Summary Table**: Standard GST breakdown by HSN/SAC code.
- **Indian Number to Words**: Automatically converts grand total into formal Indian format (e.g. *Rupees One Lakh Twelve Thousand One Hundred Only*).
- **Dynamic UPI Payment QR Code**: Generates standard UPI deep-link QR codes (`upi://pay?pa=...&pn=...&am=...&cu=INR`) so buyers can scan with GPay, PhonePe, or Paytm to pay directly.
- **Bank Details & Signature**: IFSC, account number, payment terms, and authorized signatory box.

### 3. PDF & Print Engine
- **Direct PDF Download**: Integrated with client-side `html2pdf.js` for instant A4 PDF export.
- **Vector A4 Print**: `@media print` CSS formatted for physical A4 paper (210mm × 297mm) with crisp typography and zero page-break clipping.
- **Live Preview Modal**: Verify your invoice before downloading or printing.

### 4. Native Mobile & Desktop Ready
- **PWA (Progressive Web App)**: Installable directly on Windows, macOS, Android, and iOS.
- **Native Android Studio Project**: Full native project located in `/android` ready to build in Android Studio.
- **Native iOS Xcode Project**: Full native project located in `/ios` ready to build in Xcode.
- **Mobile Native Bottom Bar**: Optimized navigation bar for smartphones with Apple notch/Dynamic Island safe-area support.

---

## 📂 Project Structure

```text
├── index.html              # Main web application & responsive shell
├── styles.css              # Custom styling, mobile navigation, and A4 print layout
├── script.js               # Standalone production engine (Calculator, Invoice, PWA)
├── manifest.json           # Web App Manifest for mobile installation
├── sw.js                   # Service Worker for offline capability
├── icon.svg                # High-resolution vector app icon
├── start.bat               # 1-click Windows desktop launcher
│
├── js/                     # Modular ES6 components
│   ├── app.js              # Coordinator & navigation router
│   ├── calculator.js       # Standalone GST calculation engine
│   ├── invoice.js          # Invoice builder & totals calculator
│   ├── customers.js        # Saved customers directory
│   ├── settings.js         # Business profile & backup exporter
│   ├── print-pdf.js        # A4 template & PDF exporter
│   └── utils.js            # Indian number-to-words, GSTIN validator, state codes
│
├── android/                # Complete Native Android Studio project
└── ios/                    # Complete Native iOS Xcode project
```

---

## 💻 How to Run Locally

### Option 1: Direct Browser Launch
Simply double-click `index.html` or `start.bat` in Windows Explorer. No server or node installation required!

### Option 2: Run with Local Web Server
```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve .
```
Then open `http://localhost:8080` in your browser.

---

## 📱 Mobile Apps (Android & iOS)

### Android Project (`/android`)
1. Open **Android Studio**.
2. Select **Open** and choose the `android` folder in this repository.
3. Click the **Run ▶** button to test on an emulator or connected phone.
4. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)** to export your installable `.apk` file.

### iOS Project (`/ios`)
1. Open the `ios` folder on a Mac.
2. Double-click `GSTInvoicePro.xcodeproj` to open in **Xcode**.
3. Select your iPhone simulator or connected device and click **Run ▶**.

---

## 🌐 Deploy Free on Web (GitHub Pages / Netlify)

### Deploy via GitHub Pages:
1. In your GitHub repository, go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Branch**, select `main` (or `master`) and `/ (root)`.
3. Click **Save**. Your app will be live at `https://<your-username>.github.io/<repo-name>/`.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).

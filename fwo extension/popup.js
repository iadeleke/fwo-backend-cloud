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
  if (ledgerLogs) ledgerLogs.innerText = '> Initiating multi-node network infrastructure sync...';

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  // Dispatch secure payload structure to pull down your verified tokens
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
    if (networkData.status === "AUTHORIZED") {
      clearInterval(expirationCountdownTimer);
      
      const pipelineRoutingToken = networkData.iso_bin_routing_token;
      const vaultReceipt = networkData.vault_receipt;

      chrome.storage.local.set({ "active_vault_receipt": vaultReceipt });

      if (logSummary) logSummary.innerHTML = "<strong>AUTOMATION ACTIVE</strong>";
      
      // Stream each structural network connection log node explicitly to the UI console
      if (networkData.network_telemetry_logs) {
        networkData.network_telemetry_logs.forEach(logLine => {
          if (ledgerLogs) ledgerLogs.innerText += `\n${logLine}`;
        });
      }

      // Convey automated instructions down into content.js running on web context
      chrome.tabs.sendMessage(activeTab.id, { 
        action: "START_AUTO_CHECKOUT", 
        tokenData: pipelineRoutingToken,
        vaultReceipt: vaultReceipt
      }, (pipelineFeedback) => {
        if (!chrome.runtime.lastError && pipelineFeedback) {
          if (ledgerLogs) ledgerLogs.innerText += `\n> Page Execution Update: ${pipelineFeedback.status}`;
          setTimeout(() => { window.close(); }, 3000); // 3s pause to let the user review connection logs
        }
      });
    }
  } catch (err) {
    if (logSummary) { logSummary.style.color = '#c92a2a'; logSummary.innerText = 'GATEWAY ERROR'; }
    console.error("[FWO Context Exception Handled]", err);
  });
});



// ============================================================================
// FWO LIVE PRODUCTION APPEND: ENTERPRISE LIVE TRANSACTION CONTROLLER
// ============================================================================

if (document.getElementById('injectBtn')) {
  document.getElementById('injectBtn').addEventListener('click', async () => {
    const logSummary = document.getElementById('logSummary');
    const ledgerLogs = document.getElementById('ledgerLogs');
    const liveProductionGate = 'https://onrender.com';

    if (logSummary) logSummary.innerHTML = "<strong>CONNECTING LIVE...</strong>";
    if (ledgerLogs) ledgerLogs.innerText += '\n> Requesting live production tokens via FAPI 2.0 network rails...';

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab) return;

    fetch(liveProductionGate, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: "INITIAL_VAULT_QUERY", 
        origin: activeTab.url,
        environment: "PRODUCTION_LIVE" // Instruct the backend to use the active production reserve
      })
    })
    .then(res => res.json())
    .then(prodData => {
      if (prodData.status === "AUTHORIZED") {
        clearInterval(expirationCountdownTimer);
        
        const liveToken = prodData.iso_bin_routing_token;
        const liveReceipt = prodData.vault_receipt;
        const netRoute = prodData.interbank_routing;

        chrome.storage.local.set({ "active_vault_receipt": liveReceipt });

        if (logSummary) logSummary.innerHTML = "<strong>PROD LAYER ACTIVE</strong>";
        if (ledgerLogs) {
          ledgerLogs.innerText += `\n[LIVE] Connected to Ingress Node: ${netRoute.network_ingress_node}`;
          ledgerLogs.innerText += `\n[LIVE] Passing ISO BIN Token Block: ${netRoute.primary_bin_block}`;
          ledgerLogs.innerText += `\n[LIVE] Routing transaction payload directly to Google Pay production container...`;
        }

        // Pass the live data structures down into content.js to trigger the native browser handshake
        chrome.tabs.sendMessage(activeTab.id, { 
          action: "START_PRODUCTION_CHECKOUT", 
          tokenData: liveToken,
          vaultReceipt: liveReceipt,
          interbankRouting: netRoute
        }, (feedback) => {
          if (!chrome.runtime.lastError && feedback) {
            if (ledgerLogs) ledgerLogs.innerText += `\n[LIVE] Google Pay Response: ${feedback.status}`;
            setTimeout(() => { window.close(); }, 2000);
          }
        });
      }
    })
    .catch(err => {
      if (logSummary) { logSummary.style.color = '#c92a2a'; logSummary.innerText = 'PROD ROUTE FAILED'; }
    });
  });
}

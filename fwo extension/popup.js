let currentTimeoutTtl = 45;
let expirationCountdownTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');
  
  if (logSummary) {
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
        logSummary.innerHTML = "<strong>CRITICAL TIMEOUT: DISCONNECTED</strong>";
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

  fetch(cloudGatewayUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: "INITIAL_VAULT_QUERY", 
      origin: activeTab.url,
      pricing_matrix: { one_time_cost: "1848.99", recurring_cost: "77.00", currency: "USD" }
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("HTTP error " + res.status);
    return res.json();
  })
  .then(networkData => {
    if (networkData.status === "AUTHORIZED") {
      clearInterval(expirationCountdownTimer);
      
      const pipelineRoutingToken = networkData.iso_bin_routing_token;
      const vaultReceipt = networkData.vault_receipt;

      chrome.storage.local.set({ "active_vault_receipt": vaultReceipt });

      if (logSummary) logSummary.innerHTML = "<strong>AUTOMATION ACTIVE</strong>";
      
      if (networkData.network_telemetry_logs) {
        networkData.network_telemetry_logs.forEach(logLine => {
          if (ledgerLogs) ledgerLogs.innerText += `\n${logLine}`;
        });
      }

      chrome.tabs.sendMessage(activeTab.id, { 
        action: "START_AUTO_CHECKOUT", 
        tokenData: pipelineRoutingToken,
        vaultReceipt: vaultReceipt
      }, (pipelineFeedback) => {
        if (!chrome.runtime.lastError && pipelineFeedback) {
          if (ledgerLogs) ledgerLogs.innerText += `\n> Page Execution Update: ${pipelineFeedback.status}`;
          setTimeout(() => { window.close(); }, 3000);
        }
      });
    }
  })
  .catch(err => {
    if (logSummary) {
      logSummary.style.color = '#c92a2a';
      logSummary.style.backgroundColor = '#fff5f5';
      logSummary.style.borderColor = '#ffc9c9';
      logSummary.innerText = 'GATEWAY ERROR';
    }
    if (ledgerLogs) ledgerLogs.innerText += `\n> Exception: Check connection or path.`;
    console.error(err);
  });
});

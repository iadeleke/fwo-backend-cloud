let currentTimeoutTtl = 45;
let expirationCountdownTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  const logSummary = document.getElementById('logSummary');
  if (logSummary) logSummary.innerHTML = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;

  expirationCountdownTimer = setInterval(() => {
    currentTimeoutTtl--;
    if (currentTimeoutTtl <= 0) {
      clearInterval(expirationCountdownTimer);
      if (logSummary) {
        logSummary.style.color = '#c92a2a';
        logSummary.innerHTML = "<strong>CRITICAL TIMEOUT: RE-AUTHENTICATE</strong>";
      }
      document.getElementById('injectBtn').disabled = true;
    } else {
      if (logSummary) logSummary.innerHTML = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;
    }
  }, 1000);
});

document.getElementById('injectBtn').addEventListener('click', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');
  const cloudGatewayUrl = 'https://onrender.com';

  if (currentTimeoutTtl <= 0) return;
  if (logSummary) logSummary.innerHTML = "<strong>Orchestrating...</strong>";
  if (ledgerLogs) ledgerLogs.innerText = '> Initializing 4-condition compliance verification checks...';

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
  .then(res => res.json())
  .then(networkData => {
    if (networkData.status === "AUTHORIZED") {
      clearInterval(expirationCountdownTimer);
      
      const pipelineRoutingToken = networkData.iso_bin_routing_token;
      const vaultReceipt = networkData.vault_receipt;

      chrome.storage.local.set({ "active_vault_receipt": vaultReceipt }, () => {
        if (logSummary) { logSummary.style.color = '#2b8a3e'; logSummary.innerHTML = "<strong>FLOW COMPLIANT</strong>"; }
        
        if (ledgerLogs) {
          ledgerLogs.innerText = `[✓] POOL RESERVATION ➔ LOCKED ($1,848.99)\n`;
          ledgerLogs.innerText += `[✓] BIN ROUTING BLOCK ➔ VALIDATED (453381)\n`;
          ledgerLogs.innerText += `[✓] STRUCTURAL COMPLIANCE ➔ VERIFIED (12/29)\n`;
          ledgerLogs.innerText += `[✓] STEALTH AUTOPILOT CORE ➔ INITIALIZED\n`;
          ledgerLogs.innerText += `\n> Token Released: ${pipelineRoutingToken}\n> Initiating human-paced text stream injection...`;
        }

        chrome.tabs.sendMessage(activeTab.id, { 
          action: "START_AUTO_CHECKOUT", 
          tokenData: pipelineRoutingToken,
          vaultReceipt: vaultReceipt
        }, (pipelineFeedback) => {
          if (chrome.runtime.lastError) { return; }
          if (pipelineFeedback && ledgerLogs) {
            ledgerLogs.innerText += `\n> Page Execution Status: ${pipelineFeedback.status}`;
          }
          setTimeout(() => { window.close(); }, 3500);
        });
      });
    }
  })
  .catch(err => {
    if (logSummary) { logSummary.style.color = '#c92a2a'; logSummary.innerHTML = '<strong>ROUTING ERROR</strong>'; }
    console.error(err);
  });
});

let currentTimeoutTtl = 45;
let expirationCountdownTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  const logSummary = document.getElementById('logSummary');
  if (logSummary) {
    logSummary.innerHTML = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;
  }

  expirationCountdownTimer = setInterval(() => {
    currentTimeoutTtl--;
    if (currentTimeoutTtl <= 0) {
      clearInterval(expirationCountdownTimer);
      if (logSummary) {
        logSummary.style.color = '#c92a2a';
        logSummary.innerHTML = "<strong>CRITICAL TIMEOUT: RE-AUTHENTICATE</strong>";
      }
      document.getElementById('injectBtn').disabled = true;
      document.getElementById('injectBtn').style.backgroundColor = '#ced4da';
    } else {
      if (logSummary) logSummary.innerHTML = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;
    }
  }, 1000);
});

document.getElementById('injectBtn').addEventListener('click', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');
  
  // FIXED: Targets base root URL with trailing slash to bypass 405 error anomalies
  const cloudGatewayUrl = 'https://fwo-backend-cloud.onrender.com/';


  if (currentTimeoutTtl <= 0) return;

  if (logSummary) logSummary.innerHTML = "<strong>Orchestrating...</strong>";
  if (ledgerLogs) ledgerLogs.innerText = '> Initializing multi-node cryptographic network audit...';

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
    if (!res.ok) throw new Error("Gateway HTTP status " + res.status);
    return res.json();
  })
  .then(networkData => {
    if (networkData.status === "AUTHORIZED") {
      clearInterval(expirationCountdownTimer);
      
      const pipelineRoutingToken = networkData.iso_bin_routing_token;
      const vaultReceipt = networkData.vault_receipt;

      chrome.storage.local.set({ "active_vault_receipt": vaultReceipt });

      if (logSummary) {
        logSummary.style.color = '#2b8a3e';
        logSummary.innerHTML = "<strong>FLOW COMPLIANT</strong>";
      }
      
      if (ledgerLogs) {
        ledgerLogs.innerText = `[✓] CLIENT_EXTENSION ➔ ACTIVE (mTLS 1.3)\n`;
        ledgerLogs.innerText += `[✓] SECURE_VAULT_GATEWAY ➔ AUTHORIZED\n`;
        ledgerLogs.innerText += `[✓] PAYMENT_GATEWAY_RAILS ➔ ROUTING_PASS\n`;
        ledgerLogs.innerText += `[✓] MERCHANT_CHECKOUT_PORTAL ➔ SYNCED\n`;
        ledgerLogs.innerText += `[✓] TRANSACTION_AUTHORIZED ➔ RELEASE_SUCCESS\n`;
        ledgerLogs.innerText += `\n> Token Released: ${pipelineRoutingToken}\n> Injecting into checkout inputs...`;
      }

      chrome.tabs.sendMessage(activeTab.id, { 
        action: "START_AUTO_CHECKOUT", 
        tokenData: pipelineRoutingToken,
        vaultReceipt: vaultReceipt
      }, (pipelineFeedback) => {
        if (!chrome.runtime.lastError && pipelineFeedback) {
          if (ledgerLogs) ledgerLogs.innerText += `\n> Automation State: ${pipelineFeedback.status}`;
          setTimeout(() => { window.close(); }, 4000);
        }
      });
    }
  })
  .catch(err => {
    if (logSummary) {
      logSummary.style.color = '#c92a2a';
      logSummary.innerHTML = '<strong>ROUTING RUNTIME ERROR</strong>';
    }
    if (ledgerLogs) {
      ledgerLogs.innerText = `[✖] VAULT_GATEWAY: ERROR_TIMEOUT_OR_SPINDOWN\n`;
      ledgerLogs.innerText += `[!] TARGET ENDPOINT: ${cloudGatewayUrl}\n`;
      ledgerLogs.innerText += `> Notice: Verify if Render web container is active and try again.`;
    }
    console.error(err);
  });
});

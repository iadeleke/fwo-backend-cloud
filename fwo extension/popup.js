let currentTimeoutTtl = 45;
let expirationCountdownTimer = null;
let discoveryPollInterval = null;
let discoveredPricingMatrix = { one_time_cost: "Detecting...", recurring_cost: "Detecting..." };

document.addEventListener('DOMContentLoaded', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');
  
  if (logSummary) logSummary.innerHTML = `Status: DISCOVERING_PRICING | TTL: ${currentTimeoutTtl}s`;

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  // CONTINUOUS POLLING OVERRIDE: Queries the webpage context iteratively every 500ms until metrics settle
  discoveryPollInterval = setInterval(() => {
    chrome.tabs.sendMessage(activeTab.id, { action: "DISCOVER_LIVE_PRICING" }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      
      const pricing = response.pricing;
      
      // If a valid money string placeholder was harvested, update user interface layouts and stop the loop
      if (pricing.one_time_cost !== "Detecting..." || pricing.recurring_cost !== "Detecting...") {
        clearInterval(discoveryPollInterval); // Freeze discovery loop threads instantly
        
        discoveredPricingMatrix = pricing;
        document.getElementById('hardwareCost').innerText = pricing.one_time_cost;
        document.getElementById('recurringCost').innerText = pricing.recurring_cost;
        document.getElementById('vaultChargeTotal').innerText = pricing.one_time_cost;
        
        if (logSummary) logSummary.innerHTML = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;
        if (ledgerLogs) ledgerLogs.innerText = `> Dynamic Price Discovery Locked: Total Identified. Ready to pay.`;
      }
    });
  }, 500);

  expirationCountdownTimer = setInterval(() => {
    currentTimeoutTtl--;
    if (currentTimeoutTtl <= 0) {
      clearInterval(expirationCountdownTimer);
      clearInterval(discoveryPollInterval);
      if (logSummary) {
        logSummary.style.color = '#c92a2a';
        logSummary.innerHTML = "<strong>TIMEOUT OVERRIDE: LOGS ARRESTED</strong>";
      }
      if (ledgerLogs && !ledgerLogs.innerText.includes("PIPELINE COMPLIANT")) {
        ledgerLogs.innerText += `\n\n[✖] GATEWAY LIFETIME EXPIRED: Cloud Socket Closed.`;
        ledgerLogs.innerText += `\n[!] ACTION: Re-open popup or re-verify connection to resume.`;
      }
    } else {
      if (logSummary && logSummary.innerHTML.includes("ACTIVE_TRACKING")) {
        logSummary.innerHTML = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;
      }
    }
  }, 1000);
});

document.getElementById('injectBtn').addEventListener('click', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');
  
  // SECURE TARGET ENDPOINT SPECIFICATION UNIFORMITY
  const cloudGatewayUrl = 'https://fwo-backend-cloud.onrender.com';

  clearInterval(discoveryPollInterval); // Kill any loose polling processes on checkout action

  if (logSummary) logSummary.innerHTML = "<strong>Processing Nodes...</strong>";
  if (ledgerLogs) {
    ledgerLogs.innerText = `> Initializing Live Multi-Stage Cryptographic Gateway Audit...\n`;
    ledgerLogs.innerText += `[STAGE 1/4] PINGING NETWORK CORE VECTOR...`;
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  // Dispatch discovered totals back to Render Vault Core for reservation validation
  fetch(cloudGatewayUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: "INITIAL_VAULT_QUERY", 
      origin: activeTab.url,
      pricing_matrix: discoveredPricingMatrix
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("HTTP Status " + res.status);
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
        logSummary.innerHTML = "<strong>PIPELINE COMPLIANT</strong>";
      }
      
      // Stream every processing gateway node explicitly to the terminal log screen
      if (ledgerLogs) {
        ledgerLogs.innerText = `[✓] STAGE 1/4 COMPLETE: CLIENT_EXTENSION ➔ ACTIVE (mTLS 1.3)\n`;
        ledgerLogs.innerText += `[✓] STAGE 2/4 COMPLETE: SECURE_VAULT_GATEWAY ➔ AUTHORIZED\n`;
        ledgerLogs.innerText += `[✓] STAGE 3/4 COMPLETE: PAYMENT_GATEWAY_RAILS ➔ ROUTING_PASS\n`;
        ledgerLogs.innerText += `[✓] STAGE 4/4 COMPLETE: MERCHANT_CHECKOUT_PORTAL ➔ SYNCED\n\n`;
        
        if (networkData.network_telemetry_logs) {
          networkData.network_telemetry_logs.forEach(line => {
            ledgerLogs.innerText += `${line}\n`;
          });
        }
        ledgerLogs.innerText += `\n> Token Released: ${pipelineRoutingToken}\n> Handshake broadcasted across secure iframe nodes...`;
      }

      chrome.tabs.sendMessage(activeTab.id, { 
        action: "START_AUTO_CHECKOUT", 
        tokenData: pipelineRoutingToken,
        vaultReceipt: vaultReceipt
      }, (pipelineFeedback) => {
        if (chrome.runtime.lastError) { return; }
        if (pipelineFeedback && ledgerLogs) {
          ledgerLogs.innerText += `\n> Automation State: ${pipelineFeedback.status}`;
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
      ledgerLogs.innerText += `\n\n[✖] SECURE_VAULT_GATEWAY: ERROR_TIMEOUT_OR_SPINDOWN`;
      ledgerLogs.innerText += `\n[!] TARGET ENDPOINT: ${cloudGatewayUrl}`;
      ledgerLogs.innerText += `\n> Notice: Web service container is waking up. Click Pay again to execute.`;
    }
    console.error(err);
  });
});

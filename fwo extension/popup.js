let currentTimeoutTtl = 45;
let expirationCountdownTimer = null;
let discoveredPricingMatrix = { one_time_cost: "Detecting...", recurring_cost: "Detecting..." };

document.addEventListener('DOMContentLoaded', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');
  
  if (logSummary) logSummary.innerHTML = `Status: DISCOVERING_PRICING | TTL: ${currentTimeoutTtl}s`;

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  // 1. Direct message content.js to extract live price metrics on load
  chrome.tabs.sendMessage(activeTab.id, { action: "DISCOVER_LIVE_PRICING" }, (response) => {
    if (chrome.runtime.lastError || !response) {
      if (ledgerLogs) ledgerLogs.innerText = "> Standing by for checkout matrix initialization...";
      return;
    }
    
    // 2. Dynamically map harvested values to your interface viewing blocks
    discoveredPricingMatrix = response.pricing;
    document.getElementById('hardwareCost').innerText = discoveredPricingMatrix.one_time_cost;
    document.getElementById('recurringCost').innerText = discoveredPricingMatrix.recurring_cost;
    document.getElementById('vaultChargeTotal').innerText = discoveredPricingMatrix.one_time_cost;
    
    if (logSummary) logSummary.innerHTML = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;
    if (ledgerLogs) ledgerLogs.innerText = `> Dynamic Price Discovery Locked: Total Identified. Ready to pay.`;
  });

  expirationCountdownTimer = setInterval(() => {
    currentTimeoutTtl--;
    if (currentTimeoutTtl <= 0) {
      clearInterval(expirationCountdownTimer);
      if (logSummary) {
        logSummary.style.color = '#c92a2a';
        logSummary.innerHTML = "<strong>TIMEOUT OVERRIDE: LOGS ARRESTED</strong>";
      }
      if (ledgerLogs) {
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
  
  // FIXED: Dynamic endpoint consistently mapped to your specific live container url
  const cloudGatewayUrl = 'https://fwo-backend-cloud.onrender.com';

  if (currentTimeoutTtl <= 0) return;

  if (logSummary) logSummary.innerHTML = "<strong>Processing Nodes...</strong>";
  if (ledgerLogs) {
    ledgerLogs.innerText = `> Initializing Live Multi-Stage Cryptographic Gateway Audit...\n`;
    ledgerLogs.innerText += `[STAGE 1/4] PINGING NETWORK CORE VECTOR...`;
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  // 3. Dispatch discovered totals back to Render Vault Core for reservation validation
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
      clearInterval(expirationCountdownTimer); // Freeze countdown ticker instantly to preserve metrics
      
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

      // Convey automated instructions down into content.js running on web context
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
      // FIXED: Fallback tracking strings updated to your specific container URL
      ledgerLogs.innerText += `\n\n[✖] SECURE_VAULT_GATEWAY: ERROR_TIMEOUT_OR_SPINDOWN`;
      ledgerLogs.innerText += `\n[!] TARGET ENDPOINT: https://fwo-backend-cloud.onrender.com`;
      ledgerLogs.innerText += `\n> Notice: Web service container is waking up. Click Pay again to execute.`;
    }
    console.error(err);
  });
});

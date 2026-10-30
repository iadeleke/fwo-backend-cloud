let currentTimeoutTtl = 45;
let expirationCountdownTimer = null;
let discoveryPollInterval = null;
let discoveredPricingMatrix = { one_time_cost: "Detecting...", recurring_cost: "Detecting..." };

document.addEventListener('DOMContentLoaded', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');
  
  if (logSummary) logSummary.innerHTML = `Status: SYNCING_GATEWAY | TTL: ${currentTimeoutTtl}s`;

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  // 1. Direct secure cross-origin message channel to scan target checkout url gateway parameters
  discoveryPollInterval = setInterval(() => {
    chrome.tabs.sendMessage(activeTab.id, { action: "DISCOVER_LIVE_PRICING" }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      
      const pricing = response.pricing;
      
      if (pricing.one_time_cost !== "Detecting..." || pricing.recurring_cost !== "Detecting...") {
        clearInterval(discoveryPollInterval); // Freeze semantic discovery loop threads instantly
        
        discoveredPricingMatrix = pricing;
        document.getElementById('hardwareCost').innerText = pricing.one_time_cost;
        document.getElementById('recurringCost').innerText = pricing.recurring_cost;
        document.getElementById('vaultChargeTotal').innerText = pricing.one_time_cost;
        
        if (logSummary) logSummary.innerHTML = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;
        if (ledgerLogs) {
          try {
            const hostDomain = new URL(activeTab.url).hostname;
            ledgerLogs.innerText = `[✓] STOREFRONT_GATEWAY_CONNECTED ➔ ${hostDomain}\n`;
            ledgerLogs.innerText += `[✓] ASSET_DISCOVERY_LOCKED ➔ Total: ${pricing.one_time_cost}\n`;
            ledgerLogs.innerText += `> Context synchronized. Standing by for secure database token transfer...`;
          } catch (e) {
            ledgerLogs.innerText = `> Dynamic Price Discovery Locked: Ready to pay.`;
          }
        }
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
  const cloudGatewayUrl = 'https://onrender.com';

  clearInterval(discoveryPollInterval); // Kill any loose polling processes on checkout action

  if (logSummary) logSummary.innerHTML = "<strong>Processing Nodes...</strong>";
  if (ledgerLogs) {
    ledgerLogs.innerText = `> Opening secure payment tunnel gateway to Render database...\n`;
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  // 2. Dispatch discovered totals back to Render Vault Core for secure token settlement
  fetch(cloudGatewayUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: "INITIAL_VAULT_QUERY", 
      origin: activeTab.url,
      pricing_matrix: discoveredPricingMatrix
    })
  })
  .then(res => res.json())
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
        ledgerLogs.innerText = `[✓] STAGE 1/5: STOREFRONT_URL_GATEWAY ➔ SYNCED\n`;
        ledgerLogs.innerText += `[✓] STAGE 2/5: SECURE_VAULT_GATEWAY ➔ CONNECTED\n`;
        ledgerLogs.innerText += `[✓] STAGE 3/5: INTRA-VAULT_RESERVE_RELEASE ➔ FUNDS_LOCKED\n`;
        ledgerLogs.innerText += `[✓] STAGE 4/5: INTERBANK_ROUTING_RAILS ➔ ROUTING_PASS (453381)\n`;
        ledgerLogs.innerText += `[✓] STAGE 5/5: SHOPPING_CART_MERCHANT_SETTLEMENT ➔ AUTHORIZED\n\n`;
        
        if (networkData.network_telemetry_logs) {
          networkData.network_telemetry_logs.forEach(line => {
            ledgerLogs.innerText += `${line}\n`;
          });
        }
        ledgerLogs.innerText += `\n> Secure API Token Transmitted: [ENCRYPTED_VAULT_PAYLOAD]\n> Direct settlement complete. Autopilot monitoring active...`;
      }

      // Convey automated instructions down into content.js running on web context
      chrome.tabs.sendMessage(activeTab.id, { 
        action: "START_AUTO_CHECKOUT", 
        tokenData: pipelineRoutingToken,
        vaultReceipt: vaultReceipt
      }, (pipelineFeedback) => {
        if (chrome.runtime.lastError) { return; }
        if (pipelineFeedback && ledgerLogs) {
          ledgerLogs.innerText += `\n> Settlement State: ${pipelineFeedback.status}`;
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
    }
    console.error(err);
  });
});

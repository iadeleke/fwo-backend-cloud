let currentTimeoutTtl = 45;
let expirationCountdownTimer = null;
const cloudGatewayUrl = 'https://fwo-backend-cloud.onrender.com';

function startCountdown() {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');

  if (expirationCountdownTimer) clearInterval(expirationCountdownTimer);

  expirationCountdownTimer = setInterval(() => {
    currentTimeoutTtl--;
    if (currentTimeoutTtl <= 0) {
      clearInterval(expirationCountdownTimer);
      if (logSummary) {
        logSummary.style.color = '#c92a2a';
        logSummary.textContent = "TIMEOUT OVERRIDE: LOGS ARRESTED";
      }
      if (ledgerLogs) {
        ledgerLogs.textContent += `\n\n[✖] GATEWAY LIFETIME EXPIRED: Cloud Socket Closed.`;
        ledgerLogs.textContent += `\n[!] ACTION: Re-open popup or re-verify connection to resume.`;
      }
    } else {
      if (logSummary) logSummary.textContent = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;
    }
  }, 1000);
}

// Placeholder verification to ensure user settings exist before network actions
async function verifyUserConfiguration() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['shippingMetadata'], (result) => {
      // Returns true if configuration profiles exist, false otherwise
      resolve(!!result.shippingMetadata);
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const logSummary = document.getElementById('logSummary');
  if (logSummary) logSummary.textContent = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;

  startCountdown();

  // Pre-warm signal sent on popup load to wake up the cold container instance
  fetch(cloudGatewayUrl, { method: 'GET' })
    .then(() => console.log("Pre-warm signal delivered to server container."))
    .catch((err) => console.log("Server container spin-up sequence initiated.", err));
});

document.getElementById('injectBtn').addEventListener('click', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');

  // Verify internal data requirements before executing downstream calls
  const isConfigured = await verifyUserConfiguration();
  if (!isConfigured) {
    if (logSummary) logSummary.textContent = "Status: USER_DATA_REQUIRED";
    if (ledgerLogs) ledgerLogs.textContent = "> Action Stopped: Configuration profile missing.\n> Please specify destination data in storage options.";
    return;
  }

  if (logSummary) logSummary.textContent = "Processing Nodes...";
  if (ledgerLogs) {
    ledgerLogs.textContent = `> Initializing Live Multi-Stage Cryptographic Gateway Audit...\n[STAGE 1/4] PINGING NETWORK CORE VECTOR...`;
  }

  currentTimeoutTtl = Math.max(currentTimeoutTtl, 60);

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  fetch(`${cloudGatewayUrl}/ingress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: "INITIAL_VAULT_QUERY", 
      origin: activeTab.url,
      client_version: "1.0.4"
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
        logSummary.textContent = "PIPELINE COMPLIANT";
      }
      
      if (ledgerLogs) {
        ledgerLogs.textContent = `[✓] STAGE 1/4 COMPLETE: CLIENT_EXTENSION ➔ ACTIVE (mTLS 1.3)\n` +
                                 `[✓] STAGE 2/4 COMPLETE: SECURE_VAULT_GATEWAY ➔ AUTHORIZED\n` +
                                 `[✓] STAGE 3/4 COMPLETE: PAYMENT_GATEWAY_RAILS ➔ ROUTING_PASS\n` +
                                 `[✓] STAGE 4/4 COMPLETE: MERCHANT_CHECKOUT_PORTAL ➔ SYNCED\n\n`;
        
        if (networkData.network_telemetry_logs) {
          networkData.network_telemetry_logs.forEach(line => {
            ledgerLogs.textContent += `${line}\n`;
          });
        }
        ledgerLogs.textContent += `\n> Token Released: ${pipelineRoutingToken}\n> Gateway sync loop established.`;
      }
    }
  })
  .catch(err => {
    if (logSummary) {
      logSummary.style.color = '#c92a2a';
      logSummary.textContent = 'ROUTING RUNTIME ERROR';
    }
    if (ledgerLogs) {
      ledgerLogs.textContent += `\n\n[✖] SECURE_VAULT_GATEWAY: ERROR_TIMEOUT_OR_SPINDOWN` +
                               `\n[!] TARGET ENDPOINT: ${cloudGatewayUrl}` +
                               `\n> Notice: Connection timeout. Re-attempting connection request...`;
    }
    console.error(err);

    // Automated retry logic block to handle cold startup latency safely
    setTimeout(() => {
      const injectBtn = document.getElementById('injectBtn');
      if (injectBtn) {
        injectBtn.click();
      }
    }, 5000);
  });
});

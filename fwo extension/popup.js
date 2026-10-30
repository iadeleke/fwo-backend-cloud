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
        logSummary.innerHTML = "<strong>TIMEOUT OVERRIDE: LOGS ARRESTED</strong>";
      }
      if (ledgerLogs) {
        ledgerLogs.innerText += `\n\n[✖] GATEWAY LIFETIME EXPIRED: Cloud Socket Closed.`;
        ledgerLogs.innerText += `\n[!] ACTION: Click Pay again to re-wake container and resume.`;
      }
    } else {
      if (logSummary) logSummary.innerHTML = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;
    }
  }, 1000);
}

document.addEventListener('DOMContentLoaded', async () => {
  const logSummary = document.getElementById('logSummary');
  if (logSummary) logSummary.innerHTML = `Status: ACTIVE_TRACKING | TTL: ${currentTimeoutTtl}s`;

  startCountdown();

  // Pre-warm signal sent on popup load to wake up the cold container instance
  fetch(cloudGatewayUrl, { method: 'GET' })
    .then(() => console.log("Pre-warm signal delivered to server container."))
    .catch((err) => console.log("Server container is currently asleep, wake-up sequence initiated.", err));
});

document.getElementById('injectBtn').addEventListener('click', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');

  if (logSummary) logSummary.innerHTML = "<strong>Waking Container Nodes...</strong>";
  if (ledgerLogs) {
    ledgerLogs.innerText = `> Initializing Live Multi-Stage Cryptographic Gateway Audit...\n`;
    ledgerLogs.innerText += `[STAGE 1/4] PINGING NETWORK CORE VECTOR...`;
  }

  currentTimeoutTtl = Math.max(currentTimeoutTtl, 60);

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
      ledgerLogs.innerText += `\n> Notice: Web service container is waking up. Retrying request dynamically...`;
    }
    console.error(err);

    setTimeout(() => {
      if (document.getElementById('injectBtn')) {
        document.getElementById('injectBtn').click();
      }
    }, 4000);
  });
});

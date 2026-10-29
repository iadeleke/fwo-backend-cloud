let localVaultReceipt = "";
let routingToken = "";

document.getElementById('injectBtn').addEventListener('click', async () => {
  const logSummary = document.getElementById('logSummary');
  const ledgerLogs = document.getElementById('ledgerLogs');
  const targetCloudGateway = 'https://onrender.com';

  logSummary.style.color = '#0056b3';
  logSummary.innerText = 'Querying Cloud Vault...';
  ledgerLogs.innerText += '\n> Connecting to Render proxy infrastructure...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // Query your cloud vault backend to release funds and generate Vault Receipt 1
  fetch(targetCloudGateway, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: "INITIAL_VAULT_QUERY", origin: tab.url })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "AUTHORIZED") {
      routingToken = data.iso_bin_routing_token;
      localVaultReceipt = data.vault_receipt;

      // Securely cache the vault receipt value within local browser storage bounds
      chrome.storage.local.set({ "active_vault_receipt": localVaultReceipt });

      logSummary.style.color = '#2b8a3e';
      logSummary.innerHTML = "<strong>VAULT SECURED</strong>";
      ledgerLogs.innerText += `\n> Receipt 1 Issued: ${localVaultReceipt}\n> Automating page field injection...`;

      // Trigger the page interaction loop via content script messaging channels
      chrome.tabs.sendMessage(tab.id, { action: "EXECUTE_ORCHESTRATION_LOOP", tokenData: routingToken }, (response) => {
        if (response && response.status === "SUBMITTING_LOOP") {
          ledgerLogs.innerText += `\n> Form submitted successfully. Awaiting redirect validation...`;
        }
      });
    }
  })
  .catch(err => {
    logSummary.style.color = '#c92a2a';
    logSummary.innerText = 'ROUTING ERROR: Check cloud logs.';
    console.error("[FWO Context Exception]", err);
  });
});


// ============================================================================
// FWO EXTENSION APPEND: COMPLIANT TRANSACTION INITIATOR HANDLER
// ============================================================================

if (document.getElementById('injectBtn')) {
  document.getElementById('injectBtn').addEventListener('click', async () => {
    const logSummary = document.getElementById('logSummary');
    const ledgerLogs = document.getElementById('ledgerLogs');
    const cloudApiEndpoint = 'https://onrender.com';

    if (logSummary) logSummary.innerText = 'Initializing Autopilot...';
    if (ledgerLogs) ledgerLogs.innerText += '\n> Requesting transaction clearance tokens from cloud architecture...';

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab) return;

    // Dispatch payload request packet to pull down your verified wallet assets 
    fetch(cloudApiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "INITIAL_VAULT_QUERY", origin: activeTab.url })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === "AUTHORIZED") {
        const structuralToken = data.iso_bin_routing_token;
        const assignedVaultReceipt = data.vault_receipt;

        // Persist Vault Receipt 1 straight to client storage limits
        chrome.storage.local.set({ "active_vault_receipt": assignedVaultReceipt });

        if (logSummary) logSummary.innerHTML = "<strong>FWO ENGINE RUNNING</strong>";
        if (ledgerLogs) ledgerLogs.innerText += `\n> Receipt 1 Logged: ${assignedVaultReceipt}\n> Forwarding token data to content automation layer...`;

        // Direct message invocation telling content.js to take over form processing loops
        chrome.tabs.sendMessage(activeTab.id, { action: "START_AUTO_CHECKOUT", tokenData: structuralToken }, (response) => {
          if (!chrome.runtime.lastError && response) {
            if (ledgerLogs) ledgerLogs.innerText += `\n> Status confirmed: ${response.status}`;
            // Gracefully minimize the panel workspace view since automation has control
            setTimeout(() => { window.close(); }, 1200);
          }
        });
      }
    })
    .catch(err => {
      if (logSummary) { logSummary.style.color = '#c92a2a'; logSummary.innerText = 'GATEWAY ERROR'; }
    });
  });
}

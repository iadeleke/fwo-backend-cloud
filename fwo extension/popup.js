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

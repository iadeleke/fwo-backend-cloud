document.getElementById('injectBtn').addEventListener('click', async () => {
  const logSummary = document.getElementById('logSummary');
  logSummary.style.display = 'block';
  logSummary.style.color = '#0056b3';
  logSummary.innerText = 'Querying Vault via HTTPS...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      let amount = "27.00";
      const elements = document.querySelectorAll('.total, .amount, [class*="total"], [id*="total"], .payment-amount');
      for (let el of elements) {
        if (el.innerText) {
          let match = el.innerText.match(/\d+(\.\d{2})?/);
          if (match) { amount = match[0]; break; }
        }
      }
      return { url: window.location.origin, price: amount };
    }
  }, (results) => {
    if (!results || !results[0]) return;
    const checkoutContext = results[0].result;

    // Direct routing match to your Python server's /ingress handler path
    fetch('https://localhost:8080/ingress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: checkoutContext.url,
        checkout_details: { total_price: checkoutContext.price, currency: "USD" }
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === "AUTHORIZED" && data.token_data) {
        const activeToken = data.token_data.token_id;
        navigator.clipboard.writeText(activeToken).then(() => {
          logSummary.style.color = '#2b8a3e';
          logSummary.innerHTML = `<strong>VAULT AUTHORIZED</strong><br><span style="font-size:12px; font-family:monospace; color:#111;">${activeToken}</span><br><span style="font-size:10px; color:#666;">Copied to clipboard! Press Ctrl+V to pay.</span>`;
        });
      }
    })
    .catch((err) => {
      logSummary.style.color = '#c92a2a';
      logSummary.innerText = 'ROUTING ERROR: Check if server is running on https://localhost:8080/ingress';
      console.error("[FWO Fetch Error]", err);
    });
  });
});

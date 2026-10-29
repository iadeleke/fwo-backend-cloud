import http.server
import json
import os
import random

class SecureVaultSyncHandler(http.server.BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path in ["/ingress", "/ingress/", "/"]:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data.decode('utf-8'))
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            # STAGE 1: Process initial extension vault validation request over ISO BIN Blocks
            if payload.get("action") == "INITIAL_VAULT_QUERY":
                vault_receipt_token = f"FWO-VLT-REC-{random.randint(100000, 999999)}"
                response = {
                    "status": "AUTHORIZED",
                    "iso_bin_routing_token": "4533819200384110",
                    "sync_status": "COMPLIANT",
                    "vault_receipt": vault_receipt_token,
                    "interbank_routing": {
                        "primary_bin_block": "453381",
                        "secondary_bin_block": "453392",
                        "network_ingress_node": "api.fwobank.internal",
                        "security_protocol": "FAPI_2.0_mTLS_1.3"
                    },
                    "metrics": {"data_atomicity": "100%", "latency_ms": 4}
                }
                
            # STAGE 2: Intercept post-payment callback loops to generate consensus locks
            elif payload.get("action") == "CLOSE_OUT_TRANSACTION":
                v_rec = payload.get("vault_receipt")
                g_rec = payload.get("gateway_receipt")
                
                if v_rec and g_rec:
                    consensus_id = f"FWO-CNS-LOG-{random.randint(1000000, 9999999)}"
                    response = {
                        "status": "SETTLED",
                        "compliance_receipt": {
                            "consensus_id": consensus_id,
                            "vault_verification": v_rec,
                            "merchant_verification": g_rec,
                            "database_log_status": "CLOSED_SUCCESS"
                        }
                    }
                else:
                    response = {"status": "ERROR", "message": "Incomplete verification fields"}
            else:
                response = {"status": "UNKNOWN_ACTION"}

            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run_gateway():
    host_address = '0.0.0.0'
    port_assignment = int(os.environ.get("PORT", 10000))
    server_address = (host_address, port_assignment)
    httpd = http.server.HTTPServer(server_address, SecureVaultSyncHandler)
    print(f"FWO Transactional Receipt Engine active on port {port_assignment}...")
    httpd.serve_forever()

if __name__ == '__main__':
    run_gateway()

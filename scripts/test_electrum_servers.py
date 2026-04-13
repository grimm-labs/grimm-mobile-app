
# This script tests a list of Electrum servers by attempting to connect to them using SSL.
# It sends a simple Electrum JSON-RPC request (server.version) and checks if a valid response is received.
# If the connection or SSL handshake fails, it prints the error.
#
# If you see the error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self-signed certificate (_ssl.c:1007)
# It means the server is using a self-signed SSL certificate, which is not trusted by your system's CA store.
# This is a security feature in Python's ssl module to prevent man-in-the-middle attacks.
#
# To connect anyway (not recommended for production), you could disable certificate verification,
# but this exposes you to security risks. Only do this for testing with servers you trust.
#
# Example of disabling verification (uncomment and use at your own risk):
# context = ssl._create_unverified_context()

import socket
import ssl
import sys
from typing import List, Tuple

# Mainnet Electrum servers (name, host, port)

# mainnet Electrum servers
MAINNET_SERVERS: List[Tuple[str, str, int]] = [
    ("electrum.blockstream.info", "electrum.blockstream.info", 50002),
    ("bitcoin.lu.ke", "bitcoin.lu.ke", 50002),
    ("electrum.emzy.de", "electrum.emzy.de", 50002),
    ("fulcrum.sethforprivacy.com", "fulcrum.sethforprivacy.com", 50002),
    ("electrum.bitaroo.net", "electrum.bitaroo.net", 50002),
    ("electrum.bitaroo.net", "electrum.bitaroo.net", 50002),
    ("blockstream.info", "blockstream.info", 700),
    ("electrum.diynodes.com", "electrum.diynodes.com", 50022),
]

# testnet Electrum servers
TESTNET_SERVERS: List[Tuple[str, str, int]] = [
    ("electrum.blockstream.info", "electrum.blockstream.info", 60002),
    ("testnet.aranguren.org", "testnet.aranguren.org", 51002),
    ("testnet.qtornado.com", "testnet.qtornado.com", 51002),
]

def test_electrum_server(host: str, port: int, timeout: float = 5.0, verify_cert: bool = True) -> bool:
    """
    Try to connect to an Electrum server using SSL.
    Returns True if the connection and handshake succeed and a valid response is received, False otherwise.
    If verify_cert is False, self-signed certificates are accepted (not secure for production).
    """
    if verify_cert:
        context = ssl.create_default_context()
    else:
        context = ssl._create_unverified_context()
    try:
        with socket.create_connection((host, port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                # Send a simple Electrum request (server.version)
                ssock.sendall(b'{"id": 0, "method": "server.version", "params": ["electrum-client", "1.4"]}\n')
                response = ssock.recv(4096)
                if b'server.version' in response or b'result' in response:
                    return True
    except Exception as e:
        print(f"Error with {host}:{port} - {e}")
    return False


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Test Electrum servers (mainnet and testnet)")
    parser.add_argument('--verify-cert', action='store_true', help='Enable SSL certificate verification (default: disabled)')
    args = parser.parse_args()
    verify_cert = args.verify_cert

    print("\nTesting Mainnet Electrum servers:")
    for name, host, port in MAINNET_SERVERS:
        print(f"Testing {name} ({host}:{port})...", end=" ")
        if test_electrum_server(host, port, verify_cert=verify_cert):
            print("OK")
        else:
            print("FAILED")

    print("\nTesting Testnet Electrum servers:")
    for name, host, port in TESTNET_SERVERS:
        print(f"Testing {name} ({host}:{port})...", end=" ")
        if test_electrum_server(host, port, verify_cert=verify_cert):
            print("OK")
        else:
            print("FAILED")

if __name__ == "__main__":
    main()

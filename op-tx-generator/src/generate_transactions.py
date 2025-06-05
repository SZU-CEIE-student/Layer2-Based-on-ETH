from web3 import Web3
import time
from accounts import PREDEFINED_ACCOUNTS

w3 = Web3(Web3.HTTPProvider('http://localhost:9545'))

def generate_transactions():
    if not w3.is_connected():
        print("Failed to connect to the Ethereum network.")
        return

    for i in range(len(PREDEFINED_ACCOUNTS)):
        from_account = PREDEFINED_ACCOUNTS[i]
        to_account = PREDEFINED_ACCOUNTS[(i + 1) % len(PREDEFINED_ACCOUNTS)]

        tx = {
            'to': to_account['address'],
            'value': w3.to_wei(0.01, 'ether'),
            'gas': 21000,
            'gasPrice': w3.to_wei('50', 'gwei'),
            'nonce': w3.eth.get_transaction_count(from_account['address']),
        }

        signed_tx = w3.eth.account.sign_transaction(tx, from_account['private_key'])
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        print(f"Transaction sent from {from_account['address']} to {to_account['address']} with hash: {tx_hash.hex()}")

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Transaction receipt: {receipt}")

        time.sleep(1)

if __name__ == "__main__":
    while True:
        generate_transactions()
        time.sleep(5)
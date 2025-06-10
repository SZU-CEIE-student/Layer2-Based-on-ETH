from flask import Flask, render_template, request,redirect, url_for
from web3 import Web3
from datetime import datetime

# import json # Unused import

app = Flask(__name__)

# Connect to the L1 Sepolia node
# w3 = Web3(Web3.HTTPProvider('https://eth-sepolia.g.alchemy.com/v2/nGlsCbulIAOJo8_WeMmi-n7uWM3lW2fg'))
#w3 = Web3(Web3.HTTPProvider('https://eth-sepolia.g.alchemy.com/v2/nGlsCbulIAOJo8_WeMmi-n7uWM3lW2fg'))
w3 = Web3(Web3.HTTPProvider('http://localhost:9545'))
@app.route('/')
def index():
    chain_data = {
        "latest_block": "N/A",
        "gas_price": "N/A",
        "tx_count": 0,
        "syncing": False,
        "peers": "不可用",
        "recent_txs": []
    }
    try:
        chain_data["latest_block"] = w3.eth.block_number
        chain_data["gas_price"] = w3.eth.gas_price

        txs = []
        latest_block = w3.eth.block_number
        # 遍历最近10个区块，收集交易
        for block_num in range(latest_block, max(latest_block - 100, -1), -1):
            block = w3.eth.get_block(block_num, full_transactions=True)
            for tx_data in block.transactions:
                block_time = datetime.fromtimestamp(block['timestamp'])
                txs.append({
                    "hash": tx_data.hash.hex(),
                    "from": tx_data["from"],
                    "to": tx_data["to"],
                    "value": w3.from_wei(tx_data["value"], 'ether'),
                    "timestamp": block_time
                })
                if len(txs) >= 5:
                    break
            if len(txs) >= 5:
                break

        chain_data["recent_txs"] = txs
        chain_data["tx_count"] = len(txs)

        sync_status = w3.eth.syncing
        if isinstance(sync_status, bool):
            chain_data["syncing"] = sync_status
        else:
            chain_data["syncing"] = True

    except Exception as e:
        print(f"Error fetching chain data for index: {e}")

    return render_template('index.html', data=chain_data)

@app.route('/transaction/<tx_hash>')
def transaction_detail(tx_hash):
    try:
        # 获取交易详情
        tx = w3.eth.get_transaction(tx_hash)
        
        # 获取交易收据
        receipt = w3.eth.get_transaction_receipt(tx_hash)
        
        # 获取区块信息
        block = w3.eth.get_block(tx['blockNumber'])
        
        # 获取当前区块高度，用于计算确认数
        current_block = w3.eth.block_number
        confirmations = current_block - tx['blockNumber'] + 1
        
        # 构建交易详情数据
        tx_data = {
            "hash": tx_hash,
            "from": tx["from"],
            "to": tx["to"],
            "value": w3.from_wei(tx["value"], 'ether'),
            "block_number": tx["blockNumber"],
            "timestamp": datetime.fromtimestamp(block["timestamp"]),
            "gas_price": w3.from_wei(tx["gasPrice"], 'gwei'),
            "gas_limit": tx["gas"],
            "gas_used": receipt["gasUsed"],
            "status": receipt["status"],
            "confirmations": confirmations,
            "input_data": tx["input"] if tx["input"] and tx["input"] != "0x" else None
        }
        
        return render_template('transaction_detail.html', tx=tx_data)
    except Exception as e:
        return f"Error: {str(e)}", 404

@app.route('/transactions', methods=['POST'])
def transactions():
    address = request.form['address']
    try:
        transactions = []
        latest_block = w3.eth.block_number
        # 只查最近的100个区块，防止太慢
        for block_num in range(max(0, latest_block - 100), latest_block + 1):
            block = w3.eth.get_block(block_num, full_transactions=True)
            for tx in block.transactions:
                if tx['from'] == address or tx['to'] == address:
                    transactions.append({
                        'hash': tx.hash.hex(),
                        'from': tx['from'],
                        'to': tx['to'],
                        'value': w3.from_wei(tx['value'], 'ether'),
                        'block_number': tx['blockNumber']
                    })
        return render_template('results.html', transactions=transactions, address=address)
    except Exception as e:
        return str(e)
@app.route('/search', methods=['POST'])
def search():
    query = request.form['query'].strip()
    # 判断是交易哈希（长度为66且以0x开头）还是地址（长度42且以0x开头）
    if len(query) == 64:
        # 跳转到交易详情页
        return redirect(url_for('transaction_detail', tx_hash=query))
    elif query.startswith('0x') and len(query) == 42:
        # 跳转到地址查询页
        return redirect(url_for('transactions_by_address', address=query))
    else:
        return "请输入正确的钱包地址或交易哈希", 400

# 新增一个GET路由用于地址查询跳转
@app.route('/transactions/address/<address>')
def transactions_by_address(address):
    try:
        transactions = []
        latest_block = w3.eth.block_number
        for block_num in range(max(0, latest_block - 100), latest_block + 1):
            block = w3.eth.get_block(block_num, full_transactions=True)
            for tx in block.transactions:
                if tx['from'] == address or tx['to'] == address:
                    transactions.append({
                        'hash': tx.hash.hex(),
                        'from': tx['from'],
                        'to': tx['to'],
                        'value': w3.from_wei(tx['value'], 'ether'),
                        'block_number': tx['blockNumber']
                    })
        return render_template('results.html', transactions=transactions, address=address)
    except Exception as e:
        return str(e)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=12000, debug=True)
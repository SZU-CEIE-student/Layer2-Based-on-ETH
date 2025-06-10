#!/bin/bash
# 2. 部署合约
echo "部署合约到两条链..."

# 部署L1跨链桥合约
cd ~/front-end/python-flask-l1-explorer/Cross-chain-bridge
echo "部署L1跨链桥合约"
make deploy
sleep 5

# 部署L2跨链桥合约
cd ~/front-end/python-flask-l1-explorer/Cross-chain-bridge
echo "部署L2跨链桥合约"
make deploy-L2
sleep 5

# 部署主链NFT交易合约
cd ~/front-end/python-flask-l1-explorer/Main-chain-Contracts
echo "部署主链合约"
make deploy
sleep 5

# 部署L2链NFT交易合约
cd ~/front-end/python-flask-l1-explorer/Main-chain-Contracts
echo "部署L2链合约"
make deploy-L2

sleep 5

# 3. 启动中继器脚本
echo "启动中继器脚本..."
cd ~/front-end/python-flask-l1-explorer/Cross-chain-bridge/Repeater/
node repeater.js &
sleep 5
# 确保中继器脚本启动成功



echo "全部完成！"
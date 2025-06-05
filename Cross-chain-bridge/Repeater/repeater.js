const { ethers } = require('ethers');
const fs = require('fs');

// L2FastBridge的ABI
const l2BridgeAbi = JSON.parse(fs.readFileSync('./artifacts/L2FastBridge.json')).abi;
// L1FastBridge的ABI
const l1BridgeAbi = JSON.parse(fs.readFileSync('./artifacts/L1FastBridge.json')).abi;

async function startRelayer() {
    // 连接L1和L2
    const l1Provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    const l2Provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:9545');

    // LP私钥
    const lpKey = '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6';
    const l1Signer = new ethers.Wallet(lpKey, l1Provider);
    const l2Signer = new ethers.Wallet(lpKey, l2Provider);

    // 合约地址
    const l2BridgeAddress = '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35'; // 替换为实际部署地址
    const l1BridgeAddress = '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35'; // 替换为实际部署地址

    // 合约实例
    const l2Bridge = new ethers.Contract(l2BridgeAddress, l2BridgeAbi, l2Signer);
    const l1Bridge = new ethers.Contract(l1BridgeAddress, l1BridgeAbi, l1Signer);

    console.log('中继器启动,监听L2上的FastWithdrawalInitiated事件...');

    // 监听L2上的提款请求
    l2Bridge.on('FastWithdrawalInitiated', async (user, recipient, amount, requestId) => {
        console.log(`
            收到L2提款请求:
            用户: ${user}
            接收地址: ${recipient}
            金额: ${ethers.utils.formatEther(amount)} ETH
            请求ID: ${requestId}
        `);

        try {
            // 检查L1 LP余额
            const lpBalance = await l1Provider.getBalance(l1Signer.address);

            if (lpBalance.lt(amount)) {
                console.log('L1 LP余额不足,无法完成快速提款');
                return;
            }

            // 直接在L1上向接收地址发送ETH
            const tx = await l1Signer.sendTransaction({
                to: recipient,
                value: amount
            });

            console.log(`L1转账交易已提交: ${tx.hash}`);
            await tx.wait();

            // 通知L1 FastBridge合约已完成快速提款
            const completeTx = await l1Bridge.completeFastWithdrawal(
                recipient,
                amount,
                requestId
            );

            console.log(`已通知L1 FastBridge: ${completeTx.hash}`);

            // 同时在L2触发标准提款，以便LP可以在挑战期后收回资金
            const withdrawTx = await l2Bridge.initiateStandardWithdrawal(
                l1Signer.address, // LP在L1上的地址
                amount
            );

            console.log(`已启动标准提款过程: ${withdrawTx.hash}`);
        } catch (error) {
            console.error('处理快速提款请求时出错:', error);
        }
    });

    // 可以添加更多监听器，例如监听L1上的事件等
}

startRelayer().catch(console.error);
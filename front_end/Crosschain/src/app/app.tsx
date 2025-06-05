'use client'

import { useEffect, useState } from 'react';
import { useAccount, useWalletClient, usePublicClient, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
// 添加到文件顶部
import { parseAbiItem } from 'viem';

// 定义事件ABI
const DepositEventABI = parseAbiItem('event ETHDepositInitiated(address indexed from, address indexed to, uint256 amount, bytes data)');
const WithdrawEventABI = parseAbiItem('event FastWithdrawalInitiated(address indexed user, address indexed recipient, uint256 amount, uint256 indexed requestId)');

function App() {
    // 交易记录类型定义
    // 修改交易记录类型定义，使其接受null值
    type TransactionRecord = {
        id: string | `0x${string}` | null;  // 修改这里接受null
        type: 'deposit' | 'withdraw';
        from: string;
        to: string;
        amount: string;
        timestamp: number;
        hash: string | `0x${string}` | null;  // 修改这里接受null
        status: 'pending' | 'confirmed' | 'failed';
    };

    // 在App函数内添加状态
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [isLoadingTx, setIsLoadingTx] = useState(false);
    const { isConnected, address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient(); // 添加这一行
    const [sourceChain, setSourceChain] = useState('L1 (Chain ID: 900)');
    const [targetChain, setTargetChain] = useState('L1 (Chain ID: 900)');
    const [sendAmount, setSendAmount] = useState('');
    const [receiveAmount, setReceiveAmount] = useState('0.000000');
    const [isPending, setIsPending] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [error, setError] = useState('');

    const L1BridgeAddress = "0xFD840Ec94235a8884881a68BB93d0110C9955604"; // 添加类型断言
    const L1BridgeAbi = [
        "function depositETH(uint32 _minGasLimit, bytes calldata _data) payable",
    ];

    // L2FastBridge合约地址
    const L2FastBridgeAddress = "0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35" as `0x${string}`;  // 替换为你的L2FastBridge合约地址
    const L2FastBridgeAbi = [
        "function fastWithdraw(address _recipient) external payable"
    ];

    // LP地址
    const LP_ADDRESS = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720" as `0x${string}`;
    // 判断当前的交易类型
    const isL1ToL2 = sourceChain.includes('L1') && targetChain.includes('L2');
    const isL2ToL1 = sourceChain.includes('L2') && targetChain.includes('L1');
    const buttonText = isL2ToL1 ? '提款' : '存款';

    // 添加状态变量
    const [successMessage, setSuccessMessage] = useState('');

    // 添加到App组件内
    // 查询用户的交易记录
    const fetchTransactionHistory = async () => {
        if (!address || !publicClient) return;

        setIsLoadingTx(true);

        try {
            // 使用正确的事件定义
            const depositFilter = {
                address: L1BridgeAddress as `0x${string}`,
                event: DepositEventABI,
                args: {
                    from: address as `0x${string}`
                },
                fromBlock: BigInt(0),
                toBlock: 'latest' as const
            };

            const withdrawFilter = {
                address: L2FastBridgeAddress,
                event: WithdrawEventABI,
                args: {
                    user: address as `0x${string}`
                },
                fromBlock: BigInt(0),
                toBlock: 'latest' as const
            };

            // 并行查询两种事件
            const [depositLogs, withdrawLogs] = await Promise.all([
                publicClient.getLogs(depositFilter),
                publicClient.getLogs(withdrawFilter)
            ]);

            // 处理存款事件
            const depositTxs = await Promise.all(depositLogs.map(async (log) => {
                // 安全处理可能为null的值
                if (!log.transactionHash || !log.blockHash) {
                    return null;
                }

                try {
                    // 获取交易详情和区块信息
                    const tx = await publicClient.getTransaction({ hash: log.transactionHash });
                    const block = await publicClient.getBlock({ blockHash: log.blockHash });

                    // 正确处理事件参数
                    const amount = log.args?.amount || BigInt(0);

                    return {
                        id: log.transactionHash,
                        type: 'deposit' as const,
                        from: 'L1',
                        to: 'L2',
                        amount: ethers.formatEther(amount),
                        timestamp: Number(block.timestamp),
                        hash: log.transactionHash,
                        status: 'confirmed' as const
                    };
                } catch (error) {
                    console.error('处理存款事件出错:', error);
                    return null;
                }
            }));

            // 处理提款事件
            const withdrawTxs = await Promise.all(withdrawLogs.map(async (log) => {
                // 安全处理可能为null的值
                if (!log.transactionHash || !log.blockHash) {
                    return null;
                }

                try {
                    const tx = await publicClient.getTransaction({ hash: log.transactionHash });
                    const block = await publicClient.getBlock({ blockHash: log.blockHash });

                    // 正确处理事件参数
                    const amount = log.args?.amount || BigInt(0);

                    return {
                        id: log.transactionHash,
                        type: 'withdraw' as const,
                        from: 'L2',
                        to: 'L1',
                        amount: ethers.formatEther(amount),
                        timestamp: Number(block.timestamp),
                        hash: log.transactionHash,
                        status: 'confirmed' as const
                    };
                } catch (error) {
                    console.error('处理提款事件出错:', error);
                    return null;
                }
            }));

            // 合并并过滤null值，然后按时间排序
            const validDepositTxs = depositTxs.filter(Boolean) as TransactionRecord[];
            const validWithdrawTxs = withdrawTxs.filter(Boolean) as TransactionRecord[];

            const allTxs = [...validDepositTxs, ...validWithdrawTxs].sort((a, b) => b.timestamp - a.timestamp);
            setTransactions(allTxs);

        } catch (error) {
            console.error('获取交易历史失败:', error);
        } finally {
            setIsLoadingTx(false);
        }
    };
    // 添加useEffect监听钱包连接
    useEffect(() => {
        if (isConnected && address) {
            fetchTransactionHistory();
        } else {
            setTransactions([]);
        }
    }, [isConnected, address]);

    const handleSwapChains = () => {
        const temp = sourceChain;
        setSourceChain(targetChain);
        setTargetChain(temp);
        // 切换后立即重新计算
        setTimeout(() => calculateReceiveAmount(), 0);
    };

    const calculateReceiveAmount = () => {
        const amount = parseFloat(sendAmount) || 0;
        const fee = amount * 0.001; // 0.1% fee

        // 添加L1和L2之间的转换逻辑
        let received;
        if (isL1ToL2) {
            // L1到L2转账，正确计算接收金额
            received = amount - fee;
        } else if (isL2ToL1) {
            // L2到L1转账，正确计算接收金额
            received = amount - fee;
        } else {
            // 同链转账，只扣除手续费
            received = amount - fee;
        }

        // 更新接收金额状态
        setReceiveAmount(received > 0 ? received.toFixed(6) : '0.000000');
    };

    const [isLoading, setIsLoading] = useState(false);
    // 处理存款或提款的函数
    const handleTransaction = async () => {
        try {
            // 清除之前的错误信息
            setError('');

            // 检查连接状态
            if (!isConnected || !walletClient) {
                setError('请先连接钱包');
                return;
            }

            // 检查金额
            if (!sendAmount || parseFloat(sendAmount) <= 0) {
                setError('请输入有效的金额');
                return;
            }

            // 检查转账方向
            const isL1ToL2 = sourceChain.includes('L1') && targetChain.includes('L2');
            const isL2ToL1 = sourceChain.includes('L2') && targetChain.includes('L1');

            if (!isL1ToL2 && !isL2ToL1) {
                setError('仅支持L1到L2或L2到L1的转账');
                return;
            }

            setIsPending(true);

            // ETH金额转换为wei
            const amountWei = BigInt(ethers.parseEther(sendAmount).toString());

            if (isL1ToL2) {
                // L1到L2的存款，调用L1StandardBridge
                await handleDeposit(amountWei);
            } else {
                // L2到L1的提款，直接向LP转账
                await handleWithdraw(amountWei);
            }

        } catch (error: any) {
            console.error('交易错误:', error);
            setError(error.message || '交易失败');
        } finally {
            setIsPending(false);
        }
    };

    // L2到L1提款处理
    const handleWithdraw = async (amountWei: bigint) => {
        try {
            console.log('开始L2到L1提款流程...');
            console.log(`调用L2FastBridge合约: ${L2FastBridgeAddress}`);

            if (!walletClient) {
                throw new Error('钱包客户端未连接');
            }

            // 创建合约接口
            const contractInterface = new ethers.Interface(L2FastBridgeAbi);

            // 编码函数调用数据 - 将用户自己的地址作为接收者，这样LP会在L1向用户地址转账
            const calldata = contractInterface.encodeFunctionData("fastWithdraw", [address]);

            // 发送交易 - 调用合约的fastWithdraw方法
            const hash = await walletClient.sendTransaction({
                to: L2FastBridgeAddress,
                data: calldata as `0x${string}`,
                value: amountWei, // 发送ETH金额
            });

            console.log('交易已提交，哈希:', hash);
            setTxHash(hash);
            setIsConfirming(true);

            // 等待交易确认
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
                setIsConfirming(false);
                setSuccessMessage(`提款请求已确认! 稍等片刻到账。交易哈希: ${hash}`);
                // 修改handleDeposit和handleWithdraw函数，添加记录更新
                // 例如在handleDeposit函数成功部分添加：
                if (hash) {
                    // 添加新交易记录 - 修改为withdraw类型
                    const newTx: TransactionRecord = {
                        id: hash,
                        type: 'withdraw', // 这里修改为withdraw，之前标记为deposit是错误的
                        from: 'L2',
                        to: 'L1',
                        amount: ethers.formatEther(amountWei),
                        timestamp: Math.floor(Date.now() / 1000),
                        hash: hash,
                        status: 'pending'
                    };

                    setTransactions(prev => [newTx, ...prev]);

                    // 等待交易确认后更新状态
                    if (publicClient) {
                        publicClient.waitForTransactionReceipt({ hash }).then(() => {
                            setTransactions(prev =>
                                prev.map(tx => tx.id === hash ? { ...tx, status: 'confirmed' } : tx)
                            );
                        }).catch(() => {
                            setTransactions(prev =>
                                prev.map(tx => tx.id === hash ? { ...tx, status: 'failed' } : tx)
                            );
                        });
                    }
                }

                // 同样在handleWithdraw中也添加类似代码
            } else {
                setIsConfirming(false);
                setSuccessMessage(`提款请求已提交! 交易哈希: ${hash}`);
            }

        } catch (error: any) {
            console.error('提款错误:', error);
            throw error;
        }
    };
    // 修改handleDeposit函数定义，接受amountWei参数
    const handleDeposit = async (amountWei: bigint) => {
        try {
            // 清除之前的错误信息
            setError('');

            // 检查连接状态和签名者
            if (!isConnected || !walletClient) {
                setError('请先连接钱包');
                return;
            }

            // 不需要再次检查金额和转账方向，因为已经在handleTransaction中检查过
            // 也不需要再创建amountWei，直接使用参数

            // 检查目标链ID
            let targetChainId = 0;
            if (targetChain.includes('901')) {
                targetChainId = 901; // L2 OPChainA
            } else if (targetChain.includes('902')) {
                targetChainId = 902; // L2 OPChainB
            } else {
                setError('不支持的目标链');
                return;
            }

            // 使用walletClient发送交易
            try {
                // 准备数据
                const minGasLimit = 200000; // 根据实际需求调整
                const data = "0x"; // 空数据

                // 创建合约接口
                const contractInterface = new ethers.Interface(L1BridgeAbi);
                // 编码函数调用数据
                const calldata = contractInterface.encodeFunctionData("depositETH", [minGasLimit, data]);

                // 发送交易
                const hash = await walletClient.sendTransaction({
                    to: L1BridgeAddress as `0x${string}`,
                    data: calldata as `0x${string}`,
                    value: amountWei, // 直接使用参数
                });

                setTxHash(hash);
                setIsConfirming(true);
                setIsPending(false);
                // 修改handleDeposit和handleWithdraw函数，添加记录更新
                // 例如在handleDeposit函数成功部分添加：
                if (hash) {
                    // 添加新交易记录
                    const newTx: TransactionRecord = {
                        id: hash,
                        type: 'deposit',
                        from: 'L1',
                        to: 'L2',
                        amount: ethers.formatEther(amountWei),
                        timestamp: Math.floor(Date.now() / 1000),
                        hash: hash,
                        status: 'pending'
                    };

                    setTransactions(prev => [newTx, ...prev]);

                    // 等待交易确认后更新状态
                    if (publicClient) {
                        publicClient.waitForTransactionReceipt({ hash }).then(() => {
                            setTransactions(prev =>
                                prev.map(tx => tx.id === hash ? { ...tx, status: 'confirmed' } : tx)
                            );
                        }).catch(() => {
                            setTransactions(prev =>
                                prev.map(tx => tx.id === hash ? { ...tx, status: 'failed' } : tx)
                            );
                        });
                    }
                }

                // 同样在handleWithdraw中也添加类似代码
                // 等待交易被包含在区块中
                alert(`存款交易已提交! 交易哈希: ${hash}`);

            } catch (err) {
                throw err;
            }
        } catch (error: any) {
            console.error('存款错误:', error);
            setError(error.message || '存款失败');
        } finally {
            setIsPending(false);
            setIsConfirming(false);
        }
    };
    return (

        <div className="py-8 px-4 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">跨链资产兑换</h1>
                    <p className="text-gray-600">支持多链资产无缝转换，实时最优汇率</p>
                    <div className="mt-4">
                        <ConnectButton />
                    </div>
                </header>

                {/* Chain Selection */}
                <div className="flex justify-between mb-6 bg-white p-4 rounded-xl shadow-sm">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">当前连接网络</label>
                        <div className="font-medium">{isConnected ? sourceChain : '未连接'}</div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">切换网络</label>
                        <select
                            className="bg-gray-100 px-3 py-1 rounded"
                            value={sourceChain}
                            onChange={(e) => setSourceChain(e.target.value)}
                        >
                            <option value="L1 (Chain ID: 900)">L1 (Chain ID: 900)</option>
                            <option value="L2 (Chain ID: 901)">L2 OPChain (Chain ID: 901)</option>
                        </select>
                    </div>
                </div>

                {/* Main Swap Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* From Section */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-semibold text-gray-700">发送</h2>
                                <div className="text-sm text-gray-500">余额: -- ETH</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl shadow-sm mb-3">
                                <label className="block text-xs text-gray-500 mb-1">来源链</label>
                                <select
                                    className="w-full bg-transparent outline-none"
                                    value={sourceChain}
                                    onChange={(e) => setSourceChain(e.target.value)}
                                >
                                    <option value="L1 (Chain ID: 900)">L1 (Chain ID: 900)</option>
                                    <option value="L2 (Chain ID: 901)">L2 OPChain (Chain ID: 901)</option>
                                </select>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl shadow-sm">
                                <label className="block text-xs text-gray-500 mb-1">发送资产</label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        className="flex-1 bg-transparent outline-none text-xl"
                                        value={sendAmount}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setSendAmount(newValue);
                                            // 确保setSendAmount完成后再计算
                                            setTimeout(() => {
                                                const amount = parseFloat(newValue) || 0;
                                                const fee = amount * 0.001;
                                                const received = amount - fee;
                                                setReceiveAmount(received > 0 ? received.toFixed(6) : '0.000000');
                                            }, 0);
                                        }}
                                    />
                                    <span className="ml-2 text-gray-500">ETH</span>
                                </div>
                            </div>
                        </div>

                        {/* Swap Icon */}
                        <div className="flex items-center justify-center">
                            <button
                                onClick={handleSwapChains}
                                className="bg-white p-3 rounded-full shadow-md hover:shadow-lg transition"
                            >
                                ⇄
                            </button>
                        </div>

                        {/* To Section */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-semibold text-gray-700">接收</h2>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl shadow-sm mb-3">
                                <label className="block text-xs text-gray-500 mb-1">目标链</label>
                                <select
                                    className="w-full bg-transparent outline-none"
                                    value={targetChain}
                                    onChange={(e) => setTargetChain(e.target.value)}
                                >
                                    <option value="L1 (Chain ID: 900)">L1 (Chain ID: 900)</option>
                                    <option value="L2 (Chain ID: 901)">L2 OPChain (Chain ID: 901)</option>
                                </select>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <label className="block text-xs text-gray-500 mb-1">接收资产</label>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        placeholder="0.0"
                                        className="flex-1 bg-transparent outline-none text-xl"
                                        value={receiveAmount}
                                        readOnly
                                    />
                                    <span className="ml-2 text-gray-500">ETH</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rate Info */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center text-sm">
                        1 ETH = 0.999 ETH（扣除手续费） | 手续费: 0.1% ({(parseFloat(sendAmount) * 0.001 || 0).toFixed(6)} ETH)
                    </div>

// 交易相关信息显示
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-center text-sm">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-center text-sm">
                            {successMessage}
                        </div>
                    )}

                    {txHash && (
                        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-center text-sm">
                            交易已提交，哈希: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                        </div>
                    )}

                    {/* 只支持L1到L2的转账提示 */}
                    {!isL1ToL2 && !isL2ToL1 && (
                        <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-center text-sm">
                            只支持L1到L2或L2到L1的转账
                        </div>
                    )}

                    {/* 交易按钮 */}
                    <button
                        className={`w-full py-3 rounded-xl text-white font-semibold mt-6 ${isConnected && (isL1ToL2 || isL2ToL1) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                            }`}
                        onClick={handleTransaction}
                        disabled={!isConnected || (!isL1ToL2 && !isL2ToL1) || isPending || isConfirming}
                    >
                        {isPending ? '处理中...' : isConfirming ? '确认中...' : buttonText}
                    </button>
                </div>

                {/* Transaction History */}
                <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <span className="mr-2">🔄</span> 兑换记录
                        {isLoadingTx && <span className="ml-2 text-sm text-gray-500">加载中...</span>}
                        <button
                            className="ml-auto text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                            onClick={fetchTransactionHistory}
                            disabled={!isConnected || isLoadingTx}
                        >
                            刷新
                        </button>
                    </h2>

                    {transactions.length === 0 ? (
                        <p className="text-center text-gray-500">{isConnected ? '暂无记录' : '请先连接钱包'}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">类型</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">从</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">到</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">金额</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">时间</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">状态</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="border-t border-gray-100">
                                            <td className="px-4 py-3 text-sm">
                                                {tx.type === 'deposit' ? '存款 ⬇️' : '提款 ⬆️'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">{tx.from}</td>
                                            <td className="px-4 py-3 text-sm">{tx.to}</td>
                                            <td className="px-4 py-3 text-sm">{parseFloat(tx.amount).toFixed(4)} ETH</td>
                                            <td className="px-4 py-3 text-sm">
                                                {new Date(tx.timestamp * 1000).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs ${tx.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {tx.status === 'confirmed' ? '已确认' :
                                                        tx.status === 'pending' ? '处理中' : '失败'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
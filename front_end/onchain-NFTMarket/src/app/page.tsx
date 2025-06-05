'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useChainId } from 'wagmi';
import { SelEthereumL1, SelfOptimismL2 } from '@/wagmi';
import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { type Transaction } from 'viem';
import { ethers } from "ethers";
import { useWalletClient } from 'wagmi';
import React from 'react';
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // 替换为实际地址
const contractABI = [
  {
    "inputs": [
      { "internalType": "uint8", "name": "_nftType", "type": "uint8" }
    ],
    "name": "mintNFT",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

export default function App() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const chainMap: { [key: number]: { name: string } } = { 900: SelEthereumL1, 901: SelfOptimismL2 };
  const chainName = chainMap[chainId]?.name;
  const { data: walletClient } = useWalletClient();
  const [transactionStatus, setTransactionStatus] = useState('暂无交易记录');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "基于区块链的NFT交易系统";
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      setTransactionStatus('正在加载交易记录...');
      setTransactions([]);

      if (!publicClient || (chainId !== 900 && chainId !== 901)) {
        setTransactionStatus('暂无交易记录');
        return;
      }

      const targetAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'.toLowerCase(); // 替换为实际的店家地址
      const fetchedTransactions: Transaction[] = [];
      let blockNumber = await publicClient.getBlockNumber();
      const blocksToScan = 100;

      try {
        for (let i = 0; i < blocksToScan && blockNumber > 0 && fetchedTransactions.length < 20; i++) {
          const block = await publicClient.getBlock({
            blockNumber: blockNumber - BigInt(i),
            includeTransactions: true
          });
          // console.log(block.transactions[0]);
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (
                (tx.to && tx.to.toLowerCase() === targetAddress) ||
                (tx.from && tx.from.toLowerCase() === targetAddress)
              ) {
                fetchedTransactions.push(tx);
                if (fetchedTransactions.length >= 20) {
                  break;
                }
              }
            }
          }

          if (blockNumber - BigInt(i) <= 0) break;
        }

        if (fetchedTransactions.length > 0) {
          const transactionList = fetchedTransactions.map(tx =>
            `Hash: ${tx.hash}, From: ${tx.from}, To: ${tx.to}, Value: ${tx.value}`
          ).join('\n');
          setTransactionStatus(`找到 ${fetchedTransactions.length} 条相关交易:\n${transactionList}`);
          setTransactions(fetchedTransactions);
        } else {
          setTransactionStatus(`在最近 ${blocksToScan} 个区块中未找到与店家地址相关的交易。`);
          setTransactions([]);
        }

      } catch (error) {
        console.error('获取交易记录失败:', error);
        setTransactionStatus(`获取交易记录失败 (${chainName || `Chain ID: ${chainId}`})`);
        setTransactions([]);
      }
    };

    fetchTransactions();
  }, [chainId, publicClient, chainName]);

  async function buyCoffeeNFT() {
    if (!walletClient) {
      alert("请先连接钱包");
      return;
    }
    setLoading(true); // 开始加载
    try {
      const ethersProvider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await ethersProvider.getSigner(walletClient.account.address);
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const value = ethers.parseEther("0.1");
      const tx = await contract.mintNFT(0, { value });
      await tx.wait();
      alert("购买 LABUBU NFT成功!");
    } catch (err: any) {
      alert("交易失败: " + (err?.reason || err?.message || String(err)));
    } finally {
      setLoading(false); // 结束加载
    }
  }

  async function buyAppleNFT() {
    if (!walletClient) {
      alert("请先连接钱包");
      return;
    }
    setLoading(true); // 开始加载
    try {
      const ethersProvider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await ethersProvider.getSigner(walletClient.account.address);
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const value = ethers.parseEther("0.2");
      const tx = await contract.mintNFT(1, { value });
      await tx.wait();
      alert("购买 奶龙 NFT成功！");
    } catch (err: any) {
      alert("交易失败: " + (err?.reason || err?.message || String(err)));
    } finally {
      setLoading(false); // 结束加载
    }
  }

  return (

    <div className="bg-gray-100 min-h-screen">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-8 py-6 shadow-lg flex flex-col items-center">
            <span className="text-lg font-semibold mb-2">交易进行中，请在钱包中确认并耐心等待区块确认...</span>
            <span className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mt-2"></span>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="bg-green-600 text-white rounded-t-2xl px-12 py-10 text-center mb-10 shadow-lg">
          <h1 className="text-4xl font-extrabold mb-4 tracking-wide">Sunbucks NFT数字藏品交易平台</h1>
          <p className="text-xl font-medium">基于区块链的NFT交易系统</p>
        </header>

        {/* 网络信息和连接钱包 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-lg font-semibold">
                当前网络: <span className="text-gray-500">{chainName || '未连接'}</span>
              </h3>
            </div>
            <div className="flex gap-3">

              <button className="border border-green-600 text-green-600 bg-transparent hover:bg-green-50 px-6 py-2 rounded-xl text-base font-semibold transition">
                <ConnectButton />
              </button>
            </div>
          </div>
        </div>

        {/* 咖啡菜单 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-bold">选择您喜欢的NFT</h2>
            <div className="mt-2 sm:mt-0 flex items-center gap-2">
              <span className="text-gray-600 text-base">NFT合约地址：</span>
              <button
                className="font-mono text-green-700 hover:underline px-2 py-1 rounded bg-gray-100"
                style={{ wordBreak: 'break-all' }}
                onClick={async () => {
                  await navigator.clipboard.writeText(contractAddress);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                title="点击复制合约地址"
              >
                {contractAddress}
              </button>
              {copied && <span className="ml-2 text-green-500 text-xs">已复制</span>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 拿铁 */}
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <img src="/labubu.jpg" alt="拿铁" className="w-full h-48 object-cover rounded-lg mb-4" />
              <h3 className="text-lg font-bold mb-2">LABUBU</h3>
              <p className="text-gray-600 text-base mb-2">中国香港艺术家龙家升创作的北欧森林精灵形象,火爆全球</p>
              <p className="font-extrabold text-lg mb-4">0.1 ETH</p>
              <button
                className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition w-full text-base font-semibold"
                onClick={buyCoffeeNFT}
                disabled={loading}
              >
                购买
              </button>
            </div>
            {/* 美式 */}
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <img src="/nailong.jpg" alt="美式" className="w-full h-48 object-cover rounded-lg mb-4" />
              <h3 className="text-lg font-bold mb-2">奶龙</h3>
              <p className="text-gray-600 text-base mb-2">国产IP,呆萌可爱又带点小机灵的大吃货幼龙一枚</p>
              <p className="font-extrabold text-lg mb-4">0.2 ETH</p>
              <button
                className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition w-full text-base font-semibold"
                onClick={buyAppleNFT}
                disabled={loading}
              >
                购买
              </button>
            </div>
          </div>
        </div>

        {/* 跨链桥 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-3">跨链转账</h2>
          <p className="text-gray-600 mb-5 text-base">将资产转移到其他区块链网络</p>
          <div className="bg-gray-100 rounded-xl p-5">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition w-full text-base font-semibold"
              onClick={() => window.open('http://localhost:3005', '_blank')}
            >
              使用跨链桥
            </button>
          </div>
        </div>

        {/* 区块链浏览器链接 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-3">到区块链浏览器查看</h2>
          <p className="text-gray-600 mb-5 text-base">查看当前网络上的交易和区块信息</p>
          <div className="bg-gray-100 rounded-xl p-5">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition w-full text-base font-semibold"
              onClick={() => {
                const explorerUrl = chainId === 900 ? 'http://localhost:11000' : chainId === 901 ? 'http://localhost:12000' : '';
                if (explorerUrl) {
                  window.open(explorerUrl, '_blank');
                }
              }}
            >
              查看浏览器
            </button>
          </div>
        </div>

        {/* 最近交易 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-3">最近交易</h2>
          <div className="bg-gray-100 rounded-xl p-5 text-center text-gray-500 text-base font-medium whitespace-pre-wrap">
            {transactions.length > 0 ? (
              <>
                <div className="mb-4">
                  {showAll
                    ? `找到 ${transactions.length} 条相关交易:`
                    : `显示最近 5 条（共 ${transactions.length} 条）相关交易:`}
                </div>
                <div className="flex flex-col gap-4">
                  {(showAll ? transactions : transactions.slice(0, 5)).map((tx, idx) => (
                    <div key={tx.hash} className="bg-white rounded p-3 shadow text-left break-all">
                      <span
                        className="text-green-700 font-mono cursor-pointer hover:underline"
                        title="点击复制 Hash"
                        onClick={async () => {
                          await navigator.clipboard.writeText(tx.hash);
                          setCopiedHash(tx.hash);
                          setTimeout(() => setCopiedHash(null), 1200);
                        }}
                      >
                        Hash: {tx.hash}
                      </span>
                      {copiedHash === tx.hash && (
                        <span className="ml-2 text-green-500 text-xs">已复制</span>
                      )}
                      <br />
                      From:{' '}
                      <span
                        className="text-blue-700 font-mono cursor-pointer hover:underline"
                        title="点击复制 From 地址"
                        onClick={async () => {
                          await navigator.clipboard.writeText(tx.from);
                          setCopiedHash('from-' + tx.hash);
                          setTimeout(() => setCopiedHash(null), 1200);
                        }}
                      >
                        {tx.from}
                      </span>
                      {copiedHash === 'from-' + tx.hash && (
                        <span className="ml-2 text-green-500 text-xs">已复制</span>
                      )}
                      <br />
                      To:{' '}
                      <span
                        className="text-blue-700 font-mono cursor-pointer hover:underline"
                        title="点击复制 To 地址"
                        onClick={async () => {
                          await navigator.clipboard.writeText(tx.to ?? '');
                          setCopiedHash('to-' + tx.hash);
                          setTimeout(() => setCopiedHash(null), 1200);
                        }}
                      >
                        {tx.to}
                      </span>
                      {copiedHash === 'to-' + tx.hash && (
                        <span className="ml-2 text-green-500 text-xs">已复制</span>
                      )}
                      <br />
                      Value:{' '}
                      <span className="text-yellow-700 font-mono">
                        {tx.value ? (Number(tx.value) / 1e18).toFixed(6) : '0.000000'} ETH
                      </span>
                    </div>
                  ))}
                </div>
                {transactions.length > 5 && (
                  <button
                    className="mt-6 px-6 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                    onClick={() => setShowAll(v => !v)}
                  >
                    {showAll ? '收起' : '展开更多'}
                  </button>
                )}
              </>
            ) : (
              transactionStatus
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-base mt-12">
          © 2025 Sunbucks NFT交易平台 - 区块链支付系统
        </footer>
      </div>
    </div>
  )
}
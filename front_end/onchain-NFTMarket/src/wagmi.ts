import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'

import { Chain } from 'wagmi/chains';
import { Abyssinica_SIL } from 'next/font/google';
export const SelfOptimismL2: Chain = {
  id: 901, // 你的链ID
  name: 'Self L2',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['http://localhost:9545'] },
  }
};
export const SelEthereumL1: Chain = {
  id: 900, // 你的链ID
  name: 'Self L1',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  }
};

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia, SelEthereumL1, SelfOptimismL2],
    connectors: [
      injected(),
      coinbaseWallet(),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [SelEthereumL1.id]: http(SelEthereumL1.rpcUrls.default.http[0]),
      [SelfOptimismL2.id]: http(SelfOptimismL2.rpcUrls.default.http[0]),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
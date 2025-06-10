// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/forge-std/src/Script.sol";
import "../src/L1FastBridge.sol";

contract DeployL1FastBridge is Script {
    function run() external {
        // 部署前设置 OptimismPortal 和 LP 地址
        address optimismPortal = vm.envAddress("OPTIMISM_PORTAL");
        address liquidityProvider = vm.envAddress("LIQUIDITY_PROVIDER");

        vm.startBroadcast();
        new L1FastBridge(optimismPortal, liquidityProvider);
        vm.stopBroadcast();
    }
}

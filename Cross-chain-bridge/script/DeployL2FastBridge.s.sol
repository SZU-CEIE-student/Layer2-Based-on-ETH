// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/forge-std/src/Script.sol";
import "../src/L2FastBridge.sol";

contract DeployL2FastBridge is Script {
    function run() external {
        // 从环境变量读取桥和LP地址
        address l2StandardBridge = vm.envAddress("L2_STANDARD_BRIDGE");
        address liquidityProvider = vm.envAddress("LIQUIDITY_PROVIDER");

        vm.startBroadcast();
        new L2FastBridge(l2StandardBridge, liquidityProvider);
        vm.stopBroadcast();
    }
}

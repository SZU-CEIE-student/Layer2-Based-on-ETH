// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/mintNFT.sol";

contract DeployCoffeeAppleNFT is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        new CoffeeAppleNFT();
        vm.stopBroadcast();
    }
}

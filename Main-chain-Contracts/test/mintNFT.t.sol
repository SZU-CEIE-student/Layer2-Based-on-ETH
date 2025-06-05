// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/mintNFT.sol";

contract CoffeeAppleNFTTest is Test {
    CoffeeAppleNFT nft;

    function setUp() public {
        nft = new CoffeeAppleNFT();
    }

    function testMintCoffeeNFT() public {
        uint256 price = 0.1 ether;
        address user = address(1);
        vm.deal(user, 1 ether);
        vm.prank(user);
        nft.mintNFT{value: price}(CoffeeAppleNFT.NFTType.Coffee);
        assertEq(nft.ownerOf(1), user);
        (CoffeeAppleNFT.NFTType nftType, uint256 nftPrice) = nft.nftInfo(1);
        assertEq(uint256(nftType), uint256(CoffeeAppleNFT.NFTType.Coffee));
        assertEq(nftPrice, price);
    }

    function testMintAppleNFT() public {
        uint256 price = 0.2 ether;
        address user = address(1);
        vm.deal(user, 1 ether);
        vm.prank(user);
        nft.mintNFT{value: price}(CoffeeAppleNFT.NFTType.Apple); // 这里要传 Apple
        assertEq(nft.ownerOf(1), user);
        (CoffeeAppleNFT.NFTType nftType, uint256 nftPrice) = nft.nftInfo(1);
        assertEq(uint256(nftType), uint256(CoffeeAppleNFT.NFTType.Apple));
        assertEq(nftPrice, price);
    }

    function test_Revert_When_MintWithInsufficientETH() public {
        vm.expectRevert();
        nft.mintNFT{value: 0.01 ether}(CoffeeAppleNFT.NFTType.Coffee);
    }
}

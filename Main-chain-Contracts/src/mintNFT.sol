// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract CoffeeAppleNFT is ERC721URIStorage {
    uint256 private _tokenIds;

    enum NFTType {
        Coffee,
        Apple
    }

    struct NFTInfo {
        NFTType nftType;
        uint256 price;
    }

    mapping(uint256 => NFTInfo) public nftInfo;
    mapping(NFTType => string) public typeToImageURI;

    constructor() ERC721("CoffeeAppleNFT", "CANFT") {
        typeToImageURI[
            NFTType.Coffee
        ] = "https://images.unsplash.com/photo-1561047029-3000c68339ca";
        typeToImageURI[
            NFTType.Apple
        ] = "https://images.unsplash.com/photo-1502741338009-cac2772e18bc";
    }

    function mintNFT(NFTType _nftType) external payable {
        uint256 price = _nftType == NFTType.Coffee ? 0.1 ether : 0.2 ether;
        require(msg.value >= price, "Insufficient ETH sent");

        _tokenIds += 1;
        uint256 newTokenId = _tokenIds;

        _safeMint(msg.sender, newTokenId);

        // 构造元数据JSON
        string memory nftTypeStr = _nftType == NFTType.Coffee
            ? "Coffee"
            : "Apple";
        string memory description = _nftType == NFTType.Coffee
            ? "A delicious coffee NFT"
            : "A fresh apple NFT";
        string memory imageURI = typeToImageURI[_nftType];
        string memory json = string(
            abi.encodePacked(
                '{"name":"',
                nftTypeStr,
                " #",
                _toString(newTokenId),
                '", "description":"',
                description,
                '", "image":"',
                imageURI,
                '"}'
            )
        );
        string memory uri = string(
            abi.encodePacked("data:application/json;utf8,", json)
        );
        _setTokenURI(newTokenId, uri);

        nftInfo[newTokenId] = NFTInfo({nftType: _nftType, price: price});
    }

    // 内部函数，将uint256转为string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

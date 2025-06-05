// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CoffeeAppleNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

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
        ] = "https://gateway.lighthouse.storage/ipfs/bafkreiaie7ahc6qcan3ctdlxcga3vl2dkavdk6cf7xisg6dbowc3cetiyq";
        typeToImageURI[
            NFTType.Apple
        ] = "https://gateway.lighthouse.storage/ipfs/bafkreic7opj6iagrl7bw54pzkly3rktyl3fbedlxsm4hhzq37qh3jkd4em";
    }

    function mintNFT(NFTType _nftType) external payable {
        uint256 price = _nftType == NFTType.Coffee ? 0.1 ether : 0.2 ether;
        require(msg.value >= price, "Insufficient ETH sent");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        string memory uri = _nftType == NFTType.Coffee
            ? "https://gateway.lighthouse.storage/ipfs/bafkreidxxpd7npdj2mu7cwjxsfnjytyeoomn4th67avky4hj3ujduqgrju"
            : "https://gateway.lighthouse.storage/ipfs/bafkreihpqkpxjnixgoykgisslewnbb4e7i4c74v65ayosdvr6ovw25bsru";
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

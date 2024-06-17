// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;

import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";


/**
 * @title nftTest
 * @author  
 *
 * @notice ERC-721 NFT token for testing
 */

contract nftTest is ERC721Enumerable
{
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mint(address account, uint256 tokenId) external {
        _safeMint(account, tokenId);
    }
}

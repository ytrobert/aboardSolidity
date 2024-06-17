// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;


/**
 * @title I_Nft
 * @author yt
 *
 * @notice Interface of NFT (ERC-721).
 */
interface I_Nft {
    function balanceOf(address owner) external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
}

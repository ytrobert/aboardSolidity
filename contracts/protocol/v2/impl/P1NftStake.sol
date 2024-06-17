// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;

import { P1Storage } from "./P1Storage.sol";
import { P1Types } from "../lib/P1Types.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
/**
 * @title P1NftStake
 * @author yt
 *
 * @notice Contract for NFT staking and unstaking.
 */

contract P1NftStake is
    P1Storage
{
    // ============ Events ============
    event LogBoost(
        address indexed account,
        address[] nft_addrs,
        uint256[] token_ids,
        uint8[] use_types,
        uint256 timestamp
    );

    event LogLand(
        address indexed account,
        address[] nft_addrs,
        uint256[] token_ids,
        uint256 timestamp
    );

    // ============ Functions ============
    /**
     * @notice Stake NFTs
     * @dev Emits LogBoost event.
     *
     * @param  account  The account for which to credit the stake.
     * @param  nft_addrs  NFT addresses.
     * @param  token_ids  NFT token IDs.
     * @param  use_types  NFT use types.
     */
    function nftBoost(
        address account,
        address[] calldata nft_addrs,
        uint256[] calldata token_ids,
        uint8[] calldata use_types
    )
        external
        nonReentrant
    {
        //check
        require(
            _NFT_BEGIN_TIMESTAMP_ <= block.timestamp && block.timestamp <= _NFT_END_TIMESTAMP_,
            "Aboard: nftBoost time incorrect"
        );
        require(
            msg.sender == account,
            "Aboard: nftBoost msg.sender is not account"
        );
        require(
            nft_addrs.length != 0,
            "Aboard: nftBoost blank"
        );
        require(
            nft_addrs.length == token_ids.length && nft_addrs.length == use_types.length,
            "Aboard: nftBoost length mismatch"
        );

        //transfer
        uint256 timestamp = block.timestamp;
        for (uint256 i = 0; i < nft_addrs.length; i++) {
            address nftContract = nft_addrs[i];
            uint256 tokenId = token_ids[i];
            uint8 useType = use_types[i];
            require(
                _NFT_CONTRACT_STATUS_[nftContract],
                "Aboard: nftBoost contract is not on"
            );
            IERC721(nftContract).transferFrom(account, address(this), tokenId);
            //status
            _NFT_USETYPE_[nftContract][tokenId] = useType;
            _addNft(account, nftContract, tokenId, timestamp);
        }
        
        //log
        emit LogBoost(
            account,
            nft_addrs,
            token_ids,
            use_types,
            timestamp
        );
    }


    // ============ Functions ============
    /**
     * @notice Unstake NFTs
     * @dev Emits LogLand event.
     *
     * @param  account  The unstaking account.
     * @param  nft_addrs  NFT addresses.
     * @param  token_ids  NFT token IDs.
     */
    function nftLand(
        address account,
        address[] calldata nft_addrs,
        uint256[] calldata token_ids
    )
        external
        nonReentrant
    {
        //check
        require(
            block.timestamp < _NFT_BEGIN_TIMESTAMP_ || _NFT_END_TIMESTAMP_ < block.timestamp,
            "Aboard: nftLand time incorrect"
        );
        require(
            msg.sender == account,
            "Aboard: nftLand msg.sender is not account"
        );
        require(
            nft_addrs.length != 0,
            "Aboard: nftLand blank"
        );
        require(
            nft_addrs.length == token_ids.length,
            "Aboard: nftLand length mismatch"
        );

        //transfer
        for (uint256 i = 0; i < nft_addrs.length; i++) {
            address nftContract = nft_addrs[i];
            uint256 tokenId = token_ids[i];
            require(
                _NFT_CONTRACT_STATUS_[nftContract],
                "Aboard: nftLand contract is not on"
            );
            require(
                _existNft(account, nftContract, tokenId),
                "Aboard: nftLand token is not boosting"
            );
            IERC721(nftContract).transferFrom(address(this), account, tokenId);
            //status
            _removeNft(account, nftContract, tokenId);
        }
        
        //log
        emit LogLand(
            account,
            nft_addrs,
            token_ids,
            block.timestamp
        );
    }

    /**
     * @dev update NFT staking status
     */
    function _addNft(
        address account, 
        address nftContract, 
        uint256 tokenId, 
        uint256 timestamp
    )
        private
    {
        P1Types.NftInfo memory nftInfo = P1Types.NftInfo(tokenId, timestamp);
        P1Types.NftList storage nftList = _NFT_STAKING_[nftContract][account];
        nftList.nftInfos.push(nftInfo);
        nftList.nftIndex[tokenId] = nftList.nftInfos.length;
    }
        
    /**
     * @dev update NFT staking status
     */
    function _removeNft(
        address account, 
        address nftContract, 
        uint256 tokenId
    )
        private
    {
        P1Types.NftList storage nftList = _NFT_STAKING_[nftContract][account];
        uint256 index = nftList.nftIndex[tokenId] - 1;
        //last element stored to index
        P1Types.NftInfo storage lastElement = nftList.nftInfos[nftList.nftInfos.length-1];
        nftList.nftInfos[index] = lastElement;
        nftList.nftIndex[lastElement.tokenId] = nftList.nftIndex[tokenId];
        //del last
        delete nftList.nftIndex[tokenId];
        nftList.nftInfos.pop();
    }

    /**
     * @dev check if the NFT is staking
     */
    function _existNft(
        address account, 
        address nftContract, 
        uint256 tokenId
    )
        private
        view
        returns (bool)
    {
        return _NFT_STAKING_[nftContract][account].nftIndex[tokenId] > 0;
    }

} 
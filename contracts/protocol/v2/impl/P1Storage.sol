// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;

import { Adminable } from "../../lib/Adminable.sol";
import { ReentrancyGuard } from "../../lib/ReentrancyGuard.sol";
import { P1Types } from "../lib/P1Types.sol";


/**
 * @title P1Storage
 * @author yt
 *
 * @notice Storage contract. Contains or inherits from all contracts that have ordered storage.
 */
contract P1Storage is
    Adminable,
    ReentrancyGuard
{
    string[] internal _TOKEN_SYMBOL_;
    mapping(address => P1Types.Balance) internal _BALANCES_;
    mapping(address => bool) internal _GLOBAL_OPERATORS_;
    mapping(address => mapping(address => bool)) internal _LOCAL_OPERATORS_;
    mapping(bytes32 => bool) internal _WD_APPLY_;
    
    address internal _TOKEN_;
    address internal _ORACLE_;
    address internal _GATEWAY_;
    address internal _SIGNER_;
    //add for update
    mapping(address => uint256) internal _WD_ID_;
    mapping(string => P1Types.TokenInfo) internal _TOKEN_MAP_;

    mapping(uint8 => P1Types.AccountTypeInfo) internal _ACCOUNT_TYPE_MAP_;
    //nft staking, contract => (acount => listStruct)
    mapping(address => mapping(address => P1Types.NftList)) internal _NFT_STAKING_;
    mapping(address => bool) internal _NFT_CONTRACT_STATUS_;
    //nft use type
    mapping(address => mapping(uint256 => uint8)) _NFT_USETYPE_;
    //nft begin & end
    uint256 _NFT_BEGIN_TIMESTAMP_;
    uint256 _NFT_END_TIMESTAMP_;
    //broker deposit minimum value
    mapping(string => uint256) internal _BROKER_MIN_;
}

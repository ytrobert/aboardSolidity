// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;


/**
 * @title P1Types
 * @author yt
 *
 * @dev Library for common types used in PerpetualV1 contracts.
 */
library P1Types {
    // ============ Structs ============
    /**
     * @dev Used to represent the tokens information the exchange supported.
     */
    struct TokenInfo {
        address token;
        uint8 status; //0:none 1:normal 2:delist
    }

    /**
     * @dev Used to represent the account type information the exchange supported.
     */
    struct AccountTypeInfo {
        mapping(address => uint256) withdrawID;
        mapping(string => P1Types.TokenInfo) tokenMap;
    }

    /**
     * @dev Used to represent the global index and each account's cached index.
     *  Used to settle funding paymennts on a per-account basis.
     */
    struct Index {
        uint32 timestamp;
        bool isPositive;
        uint128 value;
    }

    /**
     * @dev Used to track the signed position balance values for each symbol.
     */
    struct PositionStruct {
        bool positionIsPositive;
        uint120 position;
    }

    /**
     * @dev Used to track the the signed margin balance for each account.
     */
    struct MarginStruct {
        bool marginIsPositive;
        uint120 margin;
    }

    /**
     * @dev Used to track the signed margin balance and position balance values for each account.
     */
    struct Balance {
        bool marginIsPositive;
        uint120 margin;
        mapping(bytes32 => PositionStruct) tokenPosition;
    }

    /**
     * @dev Used to represent signed values.
     */    
    struct Int {
        uint256 value;
        bool isPositive;
    }
    
    /**
     * @dev Used by contracts implementing the I_P1Trader interface to return the result of a trade.
     */
    struct TradeResult {
        uint256 fee_maker;
        uint256 fee_taker;
        Int funding_maker;
        Int funding_taker;
        uint256 positionAmount;
        uint256 margin_change;
        bool is_neg_fee;
        bool isBuy; // From taker's perspective.
        bytes32 traderFlags;
    }
    
    /**
     * @dev Used to represent staked NFTs information. 
     */
    struct StakingInfo {
       address contractAddr;
       NftInfoUsetype[] nftInfos;
    }

    /**
     * @dev Used to represent staked NFT token information. 
     */
    struct NftInfo {
        uint256 tokenId;
        uint256 timestamp;
    }

    /**
     * @dev Used to represent staked NFT token information. 
     */
    struct NftInfoUsetype {
        uint256 tokenId;
        uint256 timestamp;
        uint8 usetype;
    }

    /**
     * @dev Used by contracts implementing the staked NFT tokens list with id to index mapping.
     */
    struct NftList {
        NftInfo[] nftInfos;
        //id => index+1
        mapping(uint256 => uint256) nftIndex;
    }


}

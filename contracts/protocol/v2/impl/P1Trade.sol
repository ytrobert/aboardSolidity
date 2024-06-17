// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;

//import { P1Settlement } from "./P1Settlement.sol";
import { P1Types } from "../lib/P1Types.sol";
import { P1Storage } from "./P1Storage.sol";

/**
 * @title P1Trade
 * @author yt
 *
 * @notice Contract for recording trades for every account. 
 *
 */
contract P1Trade is
    P1Storage
{
    // ============ Constants ============
    uint256 private constant FLAG_MARGIN_IS_POSITIVE = 1 << (8 * 31);
    uint256 private constant FLAG_BYTE30 = 1 << (8 * 30);

    // ============ Structs ============
    struct TradeArg {
        address account;
        bytes32 symbol;
        uint256 amount;
        uint256 fillPrice;
        P1Types.Int fee;
        P1Types.Int funding;
        bytes1 trader;
        bool isMaker;
        bool isBuy;
    }

    struct StateMachine {
        uint256 state;
        uint256 symbolsInaddr;
        uint256 symbolCounter;
        uint256 txsInsymbol;
        uint256 txCounter;
    }

    // ============ Events ============

    event LogTrade(
        address indexed account,
        bytes32 indexed symbol,
        bytes1 indexed trader,
        uint256 amount,
        uint256 fillPrice,
        //bytes32 funding,
        bytes32 fee,
        bytes32 isBuyisMaker
        //bytes32 position,
        //bytes32 qvalue
        //StateMachine sm
    );

    // ============ Functions ============

    /**
     * @notice Submits many words of trades.
     * @dev Only able to be called by gateway. Emits LogTrade event for each trade.
     *
     * @param  words    The words of trades.
     */
    function trade(
        bytes32[] calldata words
    )
        external
    {
        require(
            msg.sender == _GATEWAY_,
            "function trade: msg.sender is not gateway"
        );

        StateMachine memory sm;
        TradeArg memory td;
        //SignedMath.Int memory marginCache;
        //SignedMath.Int memory positionCache;
        for (uint256 i = 0; i < words.length; i++) {
            bytes32 word = words[i];
            if (sm.state == 0) {
                td.account = address(bytes20(word)); //first 20 bytes
                sm.symbolsInaddr = uint256(uint16(uint256(word))); //last 2 bytes
                require(
                    sm.symbolsInaddr != 0,
                    "symbolsInaddr is 0"
                );
                sm.symbolCounter = 0;
                //marginCache = getMargin(td.account);
                sm.state = 1;
            } else if (sm.state == 1) {
                td.symbol = bytes32(bytes30(word)); //first 30 bytes
                sm.txsInsymbol = uint256(uint16(uint256(word))); //last 2 bytes
                require(
                    sm.txsInsymbol != 0,
                    "txsInsymbol is 0"
                );
                sm.txCounter = 0;
                //positionCache = getPosition(td.account, td.symbol);
                sm.state = 2;
            } else if (sm.state == 2) {
                td.amount = uint256(uint160(bytes20(word)));   //first 20 bytes
                td.fillPrice = uint256(uint96(uint256(word))); //last 12 bytes
                sm.state = 3;
            } else {
                td.fee = P1Types.Int({value:uint256(uint96(bytes12(word))), isPositive:_bytes1ToBool(word[12])});     //first 12 bytes
                td.funding = P1Types.Int({value:uint256(uint96(uint256(word))), isPositive:_bytes1ToBool(word[13])}); //last 12 bytes
                td.isMaker = _bytes1ToBool(word[14]);
                td.isBuy = _bytes1ToBool(word[15]);
                td.trader = word[16];
                sm.txCounter++;
                //positionCache = positionCache.signedAdd(SignedMath.Int({value:td.amount, isPositive:td.isBuy}));
                //marginCache = marginCache.signedAdd(td.funding).signedSub(td.fee).signedSub(SignedMath.Int({value:td.amount.baseMul(td.fillPrice), isPositive:td.isBuy}));
                if (sm.txCounter == sm.txsInsymbol) {
                    sm.symbolCounter++;
                    //update position
                    //setPosition(td.account, positionCache, td.symbol);
                    if (sm.symbolCounter == sm.symbolsInaddr) {
                        //update margin
                        //setMargin(td.account, marginCache);
                        sm.state = 0;
                    } else {
                        sm.state = 1;
                    }
                } else {
                    sm.state = 2;
                }
                
                //_marginPositionChange(td);
                emit LogTrade(
                    td.account,
                    td.symbol,
                    td.trader,
                    //after indexed
                    td.amount,
                    td.fillPrice,
                    //toBytes32_signed(td.funding),
                    toBytes32_signed(td.fee),
                    toBytes32_2in(td.isBuy,td.isMaker)
                    //toBytes32_signed(positionCache),
                    //toBytes32_signed(marginCache)
                    //sm
                );
            }
        }
    }

    /**
     * @dev Returns a compressed bytes32 representation of signed integer for logging.
     */
    function toBytes32_signed(
        P1Types.Int memory funding
    )
        internal
        pure
        returns (bytes32)
    {
        uint256 result =
            funding.value
            | (funding.isPositive ? FLAG_MARGIN_IS_POSITIVE : 0);
        
        return bytes32(result);
    }

    /**
     * @dev Returns a bytes32 representation of two indicators.
     */
    function toBytes32_2in(
        bool ind0,
        bool ind1
    )
        internal
        pure
        returns (bytes32)
    {
        uint256 result = (ind0 ? FLAG_MARGIN_IS_POSITIVE: 0) | (ind1 ? FLAG_BYTE30: 0);
        return bytes32(result);
    }

    /**
     * @dev convert bytes1 to bool.
     */
    function _bytes1ToBool(
        bytes1 flag
    )
        private
        pure
        returns (bool)
    {
        return flag == 0x01;
    }

}

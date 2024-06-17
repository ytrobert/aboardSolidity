// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { P1Types } from "../lib/P1Types.sol";
import { P1Storage } from "./P1Storage.sol";

/**
 * @title P1Margin
 * @author yt
 *
 * @notice Contract for withdrawing and depositing.
 */
contract P1Margin is
    P1Storage
{
    string constant internal NATIVE_TOKEN = "ETH"; //change on different chain
    uint8 constant BROKER_TYPE = 3;

    // ============ Events ============
    event LogDeposit(
        address indexed account,
        uint8 account_type,
        string token_symbol,
        uint256 amount
    );

    event LogWithdraw(
        address indexed account,
        uint8 account_type,
        string token_symbol,
        uint256 amount,
        uint256 withdrawid
    );

    event LogCheckIn(
        address indexed account,
        uint256 timestamp
    );
    
    /**
     * @notice Check in on chain.
     * @dev Emits LogCheckIn events.
     **/
    function checkIn() external {
        emit LogCheckIn(
            msg.sender,
            block.timestamp
        );
    }

    // ============ Functions ============
    /**
     * @notice Deposit tokens from the msg.sender into an account.
     * @dev Emits LogDeposit events.
     *
     * @param  account  The account for which to credit the deposit.
     * @param  account_type  The account type.
     * @param  token_symbol  The symbol of the token.
     * @param  amount  The amount of tokens to deposit.
     */
    function deposit(
        address account,
        uint8 account_type,
        string calldata token_symbol,
        uint256 amount
    )
        external
        nonReentrant
    {
        //check deposit to himself, to avoid advisor address deposit
        require(
            msg.sender == account,
            "Aboard: deposit msg.sender is not account"
        );

        //get token info
        P1Types.TokenInfo storage token_info;
        if (account_type == 0) {
            token_info = _TOKEN_MAP_[token_symbol];
        } else {
            token_info = _ACCOUNT_TYPE_MAP_[account_type].tokenMap[token_symbol];
        }

        //check token
        //P1Types.TokenInfo storage token_info = _TOKEN_MAP_[token_symbol];
        require(
            token_info.status == 1 && token_info.token != address(0),
            "Aboard: deposit incorrect status or address"
        );

        if (account_type == BROKER_TYPE) {
            require(
                amount >= _BROKER_MIN_[token_symbol],
                "Aboard: broker deposit too small"
            );
        }

        SafeERC20.safeTransferFrom(
            IERC20(token_info.token),
            msg.sender,
            address(this),
            amount
        );
        //log
        emit LogDeposit(
            account,
            account_type,
            token_symbol,
            amount
        );
    }

    /**
     * @notice Deposit native token from the msg.sender into an account.
     * @dev Emits LogDeposit events.
     *
     * @param  account  The account for which to credit the deposit.
     * @param  account_type  The account type.
     */
    function depositNative(
        address account,
        uint8 account_type
    )
        external
        payable
        nonReentrant
    {
        //check deposit to himself, to avoid advisor address deposit
        require(
            msg.sender == account,
            "Aboard: depositNative msg.sender is not account"
        );

        //get token info
        P1Types.TokenInfo storage token_info;
        if (account_type == 0) {
            token_info = _TOKEN_MAP_[NATIVE_TOKEN];
        } else {
            token_info = _ACCOUNT_TYPE_MAP_[account_type].tokenMap[NATIVE_TOKEN];
        }
        //P1Types.TokenInfo storage token_info = _TOKEN_MAP_[NATIVE_TOKEN];
        
        require(
            token_info.status == 1,
            "Aboard: deposit native incorrect status"
        );

        if (account_type == BROKER_TYPE) {
            require(
                msg.value >= _BROKER_MIN_[NATIVE_TOKEN],
                "Aboard: broker depositNative too small"
            );
        }

        emit LogDeposit(
            account,
            account_type,
            NATIVE_TOKEN,
            msg.value
        );
    }

    /**
     * @notice token withdraw from the smart contract to account.
     * @dev    Emits LogWithdraw event. 
     *
     * @param  account_type The account type.
     * @param  token_symbol The symbol of the token.
     * @param  amount       The amount of tokens to withdraw.
     * @param  withdrawid   The the withdraw id of the tx
     * @param  timestamp    withdrawal expire timestamp
     * @param  r            signature r
     * @param  s            signature s
     * @param  v            signature v
     */
    function withdraw(
        uint8 account_type,
        string calldata token_symbol,
        uint256 amount,
        uint256 withdrawid,
        uint256 timestamp,
        bytes32 r,
        bytes32 s,
        uint8 v
    )
        external
        nonReentrant
    {
        // require(
        //     msg.sender == account,
        //     "Aboard: withdraw msg sender is not account"
        // );

        //check timestamp
        require(
            block.timestamp < timestamp,
            "Aboard: withdraw timestamp expired"
        );

        //check signature
        bytes32 applyhash = _getApplyHash(msg.sender, account_type, token_symbol, amount, withdrawid, timestamp);
        require(
            _SIGNER_ == ecrecover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", applyhash)), v, r, s),
            "Aboard: withdraw invalid signature"
        );
        
        //get account type info
        mapping(address => uint256) storage wdid = account_type == 0 ? _WD_ID_ : _ACCOUNT_TYPE_MAP_[account_type].withdrawID;
        P1Types.TokenInfo storage token_info;
        if (account_type == 0) {
            token_info = _TOKEN_MAP_[token_symbol];
        } else {
            token_info = _ACCOUNT_TYPE_MAP_[account_type].tokenMap[token_symbol];
        }

        //check withdrawid
        require(
            wdid[msg.sender] < withdrawid,
            "Aboard: withdraw id fail"
        );
        wdid[msg.sender] = withdrawid;
        
        //check token status
        //P1Types.TokenInfo storage token_info = _TOKEN_MAP_[token_symbol];
        require(
            token_info.status != 0,
            "Aboard: withdraw token incorrect status"
        );

        //native or erc20
        if (keccak256(abi.encodePacked(token_symbol)) == keccak256(abi.encodePacked(NATIVE_TOKEN))) {
            payable(msg.sender).transfer(amount);
            //yt modified for zksync, 2023-4-19
            //(bool success, ) = (msg.sender).call{value: amount}("");
            //require(success, "Aboard: transfer failed");
        } else {
            SafeERC20.safeTransfer(
                IERC20(token_info.token),
                msg.sender,
                amount
            );
        }
        
        //log
        emit LogWithdraw(
            msg.sender,
            account_type,
            token_symbol,
            amount,
            withdrawid
        );
    }


    /**
     * @dev Returns the hash of an withdraw request.
     */
    function _getApplyHash(
        address account,
        uint8 account_type,
        string calldata token_symbol,
        uint256 amount,
        uint256 withdrawid,
        uint256 timestamp
    )
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(account, account_type, token_symbol, amount, withdrawid, timestamp));
    }
}

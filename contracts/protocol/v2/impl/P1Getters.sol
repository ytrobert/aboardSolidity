// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;

import { P1Storage } from "./P1Storage.sol";
import { I_P1Oracle } from "../intf/I_P1Oracle.sol";
import { I_Nft } from "../intf/I_Nft.sol";
import { P1Types } from "../lib/P1Types.sol";


/**
 * @title P1Getters
 * @author  
 *
 * @notice Contract for read-only getters.
 */
contract P1Getters is
    P1Storage
{
    // ============ Account Getters ============

    /**
     * @notice Get the tokens list of the owner in the NFT contract
     *
     * @param  contractAddr  NFT contract address.
     * @param  owner         address of the owner.
     * @return               tokens list.
     */
    function tokensOfOwner(
        address contractAddr,
        address owner
    )
        external
        view
        returns (uint256[] memory)
    {
        I_Nft nftContract = I_Nft(contractAddr);
        uint256 bal = nftContract.balanceOf(owner);
        uint256[] memory tokenList = new uint256[](bal);
        for (uint256 i = 0; i < bal; i++) {
            uint256 tokenId = nftContract.tokenOfOwnerByIndex(owner, i);
            tokenList[i] = tokenId;
        }
        return tokenList;
    }

    /**
     * @notice Get the NFT staking list of an account.
     *
     * @param  account     The address of the account to query the NFT list.
     * @param  nftContracts NFT contracts.
     * @return             the tokens infomation list.
     */
    function getNftStakingList(
        address account,
        address[] calldata nftContracts
    )
        external
        view
        returns (P1Types.StakingInfo[] memory)
    {
        uint256 j = 0;
        P1Types.StakingInfo[] memory stakingList = new  P1Types.StakingInfo[](nftContracts.length);
        for (uint256 i = 0; i < nftContracts.length; i++) {
            address nftContract = nftContracts[i];
            require(
                _NFT_CONTRACT_STATUS_[nftContract],
                "Aboard: nftContract is not on"
            );
            P1Types.NftInfo[] storage infos = _NFT_STAKING_[nftContract][account].nftInfos;
            if (infos.length > 0) {
                P1Types.NftInfoUsetype[] memory infoUses = new P1Types.NftInfoUsetype[](infos.length);
                for (uint256 k = 0; k < infos.length; k++) {
                    P1Types.NftInfo storage info = infos[k];
                    uint8 useType = _NFT_USETYPE_[nftContract][info.tokenId];
                    infoUses[k] = P1Types.NftInfoUsetype(info.tokenId, info.timestamp, useType);
                }
                stakingList[j] = P1Types.StakingInfo(nftContract, infoUses);
                j++;
            }
        }
        P1Types.StakingInfo[] memory stakingListOut = new P1Types.StakingInfo[](j);
        for (uint256 i = 0; i < j; i++) {
            stakingListOut[i] = stakingList[i];
        }
        return stakingListOut;
    }

    /**
     * @notice Get the NFT contract status.
     *
     * @param  nftContract NFT contract.
     * @return             status.
     */
    function getNftContractStatus(
        address nftContract
    )
        external
        view
        returns (bool)
    {
        return _NFT_CONTRACT_STATUS_[nftContract];
    }

    /**
     * @notice Get the NFT contract begin & end timestamp.
     *
     * @return begin & end timestamp.
     */
    function getNftBeginEndTimestamp()
        external
        view
        returns (uint256, uint256)
    {
        return (_NFT_BEGIN_TIMESTAMP_, _NFT_END_TIMESTAMP_);
    }

    /**
     * @notice Get the positions of an account, without accounting for changes in the index.
     *
     * @param  account  The address of the account to query the position of.
     * @param  symbol   Trading tokens pair name for short.
     * @return          The position of the account on the symbol.
     */
    function getAccountPosition(
        address account,
        bytes32 symbol
    )
        external
        view
        returns (P1Types.PositionStruct memory)
    {
        return _BALANCES_[account].tokenPosition[symbol];
    }

    /**
     * @notice Get the Q value of an account, without accounting for changes in the index.
     *
     * @param  account  The address of the account to query the Qvalue of.
     * @return          The Qvalue of the account.
     */
    function getAccountQvalue(
        address account
    )
        external
        view
        returns (P1Types.MarginStruct memory)
    {
        return P1Types.MarginStruct({
            marginIsPositive: _BALANCES_[account].marginIsPositive,
            margin: _BALANCES_[account].margin
        });
    }

    /**
     * @notice Gets the local operator status of an operator for a particular account.
     *
     * @param  account   The account to query the operator for.
     * @param  operator  The address of the operator to query the status of.
     * @return           True if the operator is a local operator of the account, false otherwise.
     */
    function getIsLocalOperator(
        address account,
        address operator
    )
        external
        view
        returns (bool)
    {
        return _LOCAL_OPERATORS_[account][operator];
    }

    // ============ Global Getters ============

    /**
     * @notice Gets the global operator status of an address.
     *
     * @param  operator  The address of the operator to query the status of.
     * @return           True if the address is a global operator, false otherwise.
     */
    function getIsGlobalOperator(
        address operator
    )
        external
        view
        returns (bool)
    {
        return _GLOBAL_OPERATORS_[operator];
    }

    /**
     * @notice Gets the withdraw status of an account.
     *
     * @param  account   The account to query the withdraw status for.
     * @param  account_type   The account type.
     * @return withdraw id & block timestamp.
     */
    function getWithdrawStatus(
        address account,
        uint8 account_type
    )
        external
        view
        returns (uint256, uint256)
    {
        if (account_type == 0) {
            return (_WD_ID_[account], block.timestamp);
        } else {
            return (_ACCOUNT_TYPE_MAP_[account_type].withdrawID[account], block.timestamp);
        }
    }

    /**
     * @notice Gets the status of the token.
     *
     * @param  account_type   The account type.
     * @param  token_symbol   The symbol of the token.
     * @return The address and status of the token.
     */
    function getTokenMap(
        uint8 account_type,
        string calldata token_symbol
    )
        external
        view
        returns (P1Types.TokenInfo memory)
    {
        if (account_type == 0) {
            return _TOKEN_MAP_[token_symbol];
        } else {
            return _ACCOUNT_TYPE_MAP_[account_type].tokenMap[token_symbol];
        }
    }

    function getBrokerMin(
        string calldata token_symbol
    )
        external
        view
        returns (uint256)
    {
        return _BROKER_MIN_[token_symbol];
    }
    /**
     * @notice Gets the address of the gateway.
     *
     * @return The address of the gateway.
     */
    function getGateway()
        external
        view
        returns (address)
    {
        return _GATEWAY_;
    }

    /**
     * @notice Gets the address of the signer.
     *
     * @return The address of the signer.
     */
    function getSigner()
        external
        view
        returns (address)
    {
        return _SIGNER_;
    }

    /**
     * @notice Gets the address of the ERC20 margin contract used for margin deposits.
     *
     * @return The address of the ERC20 token.
     */
    function getTokenContract()
        external
        view
        returns (address)
    {
        return _TOKEN_;
    }

    /**
     * @notice Gets the current address of the price oracle contract.
     *
     * @return The address of the price oracle contract.
     */
    function getOracleContract()
        external
        view
        returns (address)
    {
        return _ORACLE_;
    }

    /**
     * @notice Gets the symbols array.
     *
     * @return Array of trading tokens pair names for short.
     */
    function getSymbolArray()
        external
        view
        returns (string [] memory)
    {
        return _TOKEN_SYMBOL_;
    }

    // ============ Authorized External Getters ============

    /**
     * @notice Gets the price returned by the oracle.
     * @dev Only able to be called by global operators.
     *
     * @param  symbol   Trading tokens pair name for short.
     * @return          The price returned by the current price oracle.
     */
    function getOraclePrice(
        string calldata symbol
    )
        external
        view
        returns (uint256)
    {
        require(
            _GLOBAL_OPERATORS_[msg.sender],
            "Oracle price requester not global operator"
        );
        return I_P1Oracle(_ORACLE_).getPrice(symbol);
    }
}

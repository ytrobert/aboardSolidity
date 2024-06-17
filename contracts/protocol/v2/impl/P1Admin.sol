// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;

import { P1Storage } from "./P1Storage.sol";
import { I_P1Oracle } from "../intf/I_P1Oracle.sol";
import { P1Types } from "../lib/P1Types.sol";


/**
 * @title P1Admin
 * @author yt 
 *
 * @notice Contract allowing the Admin address to set certain parameters.
 */
contract P1Admin is
    P1Storage
{
    event LogSetGateway(
        address gateway_address
    );
    event LogSetSigner(
        address signer_address
    );
    event LogSetTokenMap(
        uint8 account_type,
        string token_symbol,
        address token_address,
        uint8 status
    );
    event LogSetOracle(
        address oracle
    );
    event LogSetNftContract(
        address nftContract, 
        bool on
    );
    event LogsetNftBeginEndTimestamp(
        uint256 nftBeginTimestamp,
        uint256 nftEndTimestamp
    );
    event LogsetBrokerMin(
        string token_symbol,
        uint256 min
    );


    // ============ Functions ============

    /**
     * @notice Sets gateway address.
     * @dev Must be called by the PerpetualV1 admin. Emits the LogSetGateway event.
     *
     * @param  gateway_address  The address of gateway.
     */
    function setGateway(
        address gateway_address
    )
        external
        onlyAdmin
    {
        _GATEWAY_ = gateway_address;
        emit LogSetGateway(gateway_address);
    }

    /**
     * @notice Sets signer address.
     * @dev Must be called by the PerpetualV1 admin. Emits the LogSetSigner event.
     *
     * @param  signer_address  The address of signer.
     */
    function setSigner(
        address signer_address
    )
        external
        onlyAdmin
    {
        _SIGNER_ = signer_address;
        emit LogSetSigner(signer_address);
    }
    
    /**
     * @notice Sets NFT contract status.
     * @dev Must be called by the PerpetualV1 admin. Emits the LogSetNftContract event.
     *
     * @param  nftContract  NFT contract.
     * @param  on           status
     */
    function setNftContract(
        address nftContract,
        bool on
    )
        external
        onlyAdmin
    {
        _NFT_CONTRACT_STATUS_[nftContract] = on;
        emit LogSetNftContract(nftContract, on);
    }

    /**
     * @notice Sets NFT begin & end timestamp.
     * @dev Must be called by the PerpetualV1 admin. Emits the LogsetNftBeginEndTimestamp event.
     *
     * @param  nftBeginTimestamp begin timestamp
     * @param  nftEndTimestamp end timestamp
     */
    function setNftBeginEndTimestamp(
        uint256 nftBeginTimestamp, //seconds
        uint256 nftEndTimestamp
    )
        external
        onlyAdmin
    {
        require(
            nftBeginTimestamp <= nftEndTimestamp,
            "Aboard: NFT begin > end timestamp"
        );
        _NFT_BEGIN_TIMESTAMP_ = nftBeginTimestamp;
        _NFT_END_TIMESTAMP_ = nftEndTimestamp;
        emit LogsetNftBeginEndTimestamp(nftBeginTimestamp, nftEndTimestamp);
    }

    /**
     * @notice Sets a new token contract in the token map.
     * @dev Must be called by the PerpetualV1 admin. Emits the LogSetTokenMap event.
     *
     * @param  account_type   The account type.
     * @param  token_symbol   The symbol of the token.
     * @param  token_address  The address of the token smart contract. Native token should be 0x0000000000000000000000000000000000000000
     * @param  status         The status of the token. 0:none 1:normal 2:delist
     */
    function setTokenMap(
        uint8 account_type,
        string calldata token_symbol,
        address token_address,
        uint8 status
    )
        external
        onlyAdmin
    {
        //IERC20(token_address).totalSupply();
        if (account_type == 0) {
            _TOKEN_MAP_[token_symbol] = P1Types.TokenInfo({token:token_address, status:status});
        } else {
            _ACCOUNT_TYPE_MAP_[account_type].tokenMap[token_symbol] = P1Types.TokenInfo({token:token_address, status:status});
        }
        
        emit LogSetTokenMap(account_type, token_symbol, token_address, status);
    }

    /**
     * @notice Sets broker deposit minimum value.
     * @dev Must be called by the PerpetualV1 admin. Emits the LogsetBrokerMin event.
     *
     * @param  token_symbol   The symbol of the token.
     * @param  min            Minimum value
     */
    function setBrokerMin(
      string calldata token_symbol,
      uint256 min
    )
        external
        onlyAdmin
    {
        _BROKER_MIN_[token_symbol] = min;
        emit LogsetBrokerMin(token_symbol, min);
    }

    /**
     * @notice Sets a new price oracle contract.
     * @dev Must be called by the PerpetualV1 admin. Emits the LogSetOracle event.
     *
     * @param  oracle  The address of the new price oracle contract.
     */
    function setOracle(
        address oracle
    )
        external
        onlyAdmin
        nonReentrant
    {
        uint32 numTokens = uint32(_TOKEN_SYMBOL_.length);
        for (uint32 i = 0; i < numTokens; i++) {
            string memory token = _TOKEN_SYMBOL_[i];
            require(
                I_P1Oracle(oracle).getPrice(token) != 0,
                "New oracle cannot return a zero price"
            );
        }
        _ORACLE_ = oracle;
        emit LogSetOracle(oracle);
    }

}

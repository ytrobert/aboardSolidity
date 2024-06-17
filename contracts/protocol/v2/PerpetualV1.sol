// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;

import { P1Admin } from "./impl/P1Admin.sol";
import { P1Getters } from "./impl/P1Getters.sol";
import { P1Margin } from "./impl/P1Margin.sol";
import { P1Trade } from "./impl/P1Trade.sol";
import { P1NftStake } from "./impl/P1NftStake.sol";


/**
 * @title PerpetualV1
 * @author yt 
 *
 * @notice main Perpetual contract
 * @dev Main perpetual contract that inherits from other contracts.
 */
contract PerpetualV1 is
    P1Admin,
    P1Getters,
    P1Margin,
    P1Trade,
    P1NftStake
{}

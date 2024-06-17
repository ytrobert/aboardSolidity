// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;

import {DelayedMultiSig} from "./DelayedMultiSig.sol";

/**
 * @title P1MultisigAdmin
 * @author  
 *
 * @notice Multisig contract for admin.
 */

contract P1MultisigAdmin is 
    DelayedMultiSig
{
    constructor (
        address[] memory owners,
        uint256 required,
        uint32 secondsTimeLocked
    ) DelayedMultiSig(
        owners,
        required,
        secondsTimeLocked
    )
    {}

}

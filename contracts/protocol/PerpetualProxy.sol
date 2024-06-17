// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;

import { TransparentUpgradeableProxy } from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";


/**
 * @title PerpetualProxy
 * @author yt 
 *
 * @notice Proxy contract that forwards calls to the main Perpetual contract.
 */
contract PerpetualProxy is
    TransparentUpgradeableProxy
{
    /**
     * @dev The constructor of the proxy that sets the admin and logic.
     *
     * @param  logic  The address of the contract that implements the underlying logic.
     * @param  admin  The address of the admin of the proxy.
     * @param  data   Any data to send immediately to the implementation contract.
     */
    constructor (
        address logic,
        address admin,
        bytes memory data
    )
        //public
        TransparentUpgradeableProxy(
            logic,
            admin,
            data
        )
    {}

    /**
     * @dev Overrides the default functionality that prevents the admin from reaching the
     *  implementation contract.
     */
    function _beforeFallback() internal override {
        /* solium-disable-line no-empty-blocks */
    }
}

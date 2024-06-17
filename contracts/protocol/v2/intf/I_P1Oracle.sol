// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;


/**
 * @title I_P1Oracle
 * @author yt
 *
 * @notice Interface that PerpetualV1 Price Oracles must implement.
 */
interface I_P1Oracle {

    /**
     * @notice Returns the price of the underlying asset relative to the margin token.
     *
     * @param  symbol   Trading tokens pair name for short.
     *
     * @return The price as a fixed-point number with 18 decimals.
     */
    function getPrice(
        string calldata symbol
    )
        external
        view
        returns (uint256);
}

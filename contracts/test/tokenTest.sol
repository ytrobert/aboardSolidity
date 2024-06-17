// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
pragma abicoder v2;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";


/**
 * @title Test_Token
 * @author  
 *
 * @notice ERC-20 token for testing
 */

contract tokenTest is
    ERC20("Test Token", "TEST")
{
    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}

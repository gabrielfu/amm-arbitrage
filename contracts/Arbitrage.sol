// SPDX-License-Identifier: None
pragma solidity >=0.8.9;

import './interfaces/IERC20.sol';
import './interfaces/ICallee.sol';
import './interfaces/IPair.sol';
import './libraries/SafeMath.sol';
import './libraries/TransferHelper.sol';

contract Arbitrage is IUniswapV2Callee {
    using SafeMath for uint256;

    constructor() {}
}
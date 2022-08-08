// SPDX-License-Identifier: None
pragma solidity >=0.8.9;

// to implement flash swap callback function

interface IUniswapV2Callee {
    function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external;
}
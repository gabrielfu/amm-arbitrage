// SPDX-License-Identifier: None
pragma solidity >=0.8.9;

import './interfaces/IERC20.sol';
import './interfaces/IPair.sol';
import './libraries/SafeMath.sol';
import './libraries/TransferHelper.sol';

contract Arbitrage {
    using SafeMath for uint256;

    address payable internal immutable owner;

    /**
     * Modifier to make a function callable only by owner addresses.
     */
    modifier onlyOwner {
        require(owner == msg.sender, "UNAUTHORIZED");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function execute(
        address baseToken,
        address quoteToken,
        address pair0,
        address pair1,
        uint256 baseAmountIn
    ) public onlyOwner {
        // calculate the swapping amounts 
        (uint256 r0base, r0quote) = getReserves(pair0, baseToken, quoteToken);
        (uint256 r1quote, r1base) = getReserves(pair1, quoteToken, baseToken);
        uint256 quoteAmount = getAmountOut(baseAmountIn, r0base, r0quote);
        uint256 baseAmountOut = getAmountOut(quoteAmount, r1quote, r1base);

        require(baseAmountOut > baseAmountIn, "UNPROFITABLE");
        uint256 balanceBefore = IERC20(baseToken).balanceOf(address(this));

        // flash swap to get base token from pair1 & repay quote token in callback
        (address token0, ) = sortTokens(baseToken, quoteToken);
        (uint256 amount0Out, uint256 amount1Out) = quoteToken == token0
            ? (uint256(0), baseAmountOut)
            : (baseAmountOut, uint256(0));
        IPair(pair1).swap(
            amount0Out,
            amount1Out,
            address(this),
            abi.encode(baseToken, quoteToken, pair0, pair1, baseAmountIn, quoteAmount)
        );

        // validate the profit
        uint256 balanceAfter = IERC20(baseToken).balanceOf(address(this));
        require(balanceAfter > balanceBefore, "SOMETHING_IS_WRONG");

        // transfer the profit to owner
        TransferHelper.safeTransfer(baseToken, owner, balanceAfter - balanceBefore);
    }

    function uniswapV2Call(
        address,
        uint256,
        uint256,
        bytes calldata data
    ) external {
        _callback(data);
    }

    function _callback(
        bytes calldata data
    ) internal {
        // decode data
        (
            address baseToken, 
            address quoteToken,
            address pair0,
            address pair1,
            uint256 baseAmountIn,
            uint256 quoteAmount
        ) = abi.decode(data, (address, address, address, address, uint256, uint256));

        // swap base for quote in pair0 and repay pair1 in quote token
        TransferHelper.safeTransfer(baseToken, pair0, baseAmountIn);
        (address token0, ) = sortTokens(baseToken, quoteToken);
        (uint256 amount0Out, uint256 amount1Out) = baseToken == token0
            ? (uint256(0), quoteAmount)
            : (quoteAmount, uint256(0));
        IPair(pair0).swap(
            amount0Out,
            amount1Out,
            pair1,
            new bytes(0)
        );
    }


    // **** LIBRARY FUNCTIONS ****

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB)
        internal
        pure
        returns (address token0, address token1)
    {
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "ZERO_ADDRESS");
    }

    // fetches and sorts the reserves for a pair
    function getReserves(
        address pairAddress,
        address tokenA,
        address tokenB
    ) internal view returns (uint256 reserveA, uint256 reserveB) {
        (address token0, ) = sortTokens(tokenA, tokenB);
        (uint256 reserve0, uint256 reserve1, ) = IPair(pairAddress).getReserves();
        (reserveA, reserveB) = tokenA == token0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "INSUFFICIENT_LIQUIDITY");
        uint256 amountInWithFee = amountIn.mul(997);
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256 amountIn) {
        require(amountOut > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "INSUFFICIENT_LIQUIDITY");
        uint256 numerator = reserveIn.mul(amountOut).mul(1000);
        uint256 denominator = reserveOut.sub(amountOut).mul(997);
        amountIn = (numerator / denominator).add(1);
    }
}
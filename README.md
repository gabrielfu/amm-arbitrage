# Flash Swap Arbitrage on Constant Product AMMs

## Important
As with most open source arbitrage bots, this bot serves as a PoC only. 
AMM arbitrage is very competitive and
this bot will not be able to compete with real on-chain bots.

## Introduction
Due to a lack of an order book, automated market makers (AMM) rely heavily on 
arbitrageurs to keep quote prices close to market prices.

Thanks to the innovation of [flash swaps](https://docs.uniswap.org/protocol/V2/concepts/core-concepts/flash-swaps#capital-free-arbitrage), you can perform arbitrage transactions without the need of a starting capital.

Also thanks to the atomic property of blockchain transactions, if there is any price movement after we submitted the transaction and before it is executed, we can revert the transaction and only pay the tranasction fees.

## Usage
To deploy the contract, run 
```shell
npx hardhat run scripts/deploy.ts
```

Then, update the contract address and Infura API key at `./config.ts`.

Finally, run the bot
```shell
ts-node src/index.ts
```

## Arbitrage Model
Let's look at the pricing model for arbitraging in **constant product** AMMs such as Uniswap V2 and Sushiswap on Ethereum and most AMMs on other blockchains.

This model does not apply to Uniswap V3 which is defined by **concentrated liquidity**.

### Constant Product Formula
Suppose a trader is swapping $\delta_a$ amount of token $A$ for $\delta_b$ of token $B$, where the pool liquidites of $A$ and $B$ are $a$ and $b$ respectively, then the contant product formula holds true:
$$a \cdot b = (a + r_a\delta_a) \cdot (b - \frac{\delta_b}{r_b})$$
where $r_a$ and $r_b$ denote the commission fee in $A$ and $B$, respectively. In Uniswap V2, $r_a=0.997$ and $r_b=1$. From here, we will simply use $r=r_a$ and omit $r_b$.

Solving the equation gives
$$\delta_b=\frac{r b \delta_a}{a + r \delta_a}$$
which means the change in liquidity follows:
$$a \rightarrow a + r\delta_a$$
$$b \rightarrow b - \frac{r b \delta_a}{a + r \delta_a}$$

### Arbitrage
Let's consider an arbitrage opportunity between two AMM pools of the same pair $A$ and $B$, e.g., Uniswap V2 and SushiSwap. The two pools have their own liquidities, as followed.

|Pool|Liquidity $A$|Liquidity $B$|
|----|----|----|
|Base|$a_1$|$b_1$|
|Quote|$a_2$|$b_2$|

We will be swapping $\delta_a$ amount of $A$ from the base pool. 

From the above equations, the amount of $B$ we get is:
$$\delta_b = \frac{r b_1 \delta_a}{a_1 + r \delta_a}$$

Then, we will be swapping all $B$ for $A$ in the quote pool, getting this amount of $A$:
$$\delta_a' = \frac{r a_2 \delta_b}{b_2 + r \delta_b}$$
$$\delta_a' = \frac{r^2 a_2 b_1 \delta_a}{a_1 b_2 + r b_2 \delta_a + r^2 b_1 \delta_a}$$
$$\delta_a' = \frac{r (r a_2 b_1) \delta_a}{a_1 b_2 + (b_2 + r b_1) r \delta_a}$$
$$\delta_a' = \frac{r \frac{r a_2 b_1}{b_2 + r b_1} \delta_a}{\frac{a_1 b_2}{b_2 + r b_1} + r \delta_a}$$

We can see the two transactions can be considered as a single transaction through an equivalent pool (with both assets being $A$), with the equivalent liquidity of the selling $A$ being $a = \frac{a_1 b_2}{b_2 + r b_1}$ and buying $A$ being $a' = \frac{r a_2 b_1}{b_2 + r b_1}$.

Thus, the total arbitrage profit is 
$$P = P(\delta_a) = \delta_a' - \delta_a=\frac{r a' \delta_a}{a + r \delta_a}-\delta_a$$

Note that $r, a, a' > 0$. Therefore, in the domain of $\delta_a \in [0, \inf)$, $P(\delta_a)$ is a unimodal function with a single maximum. Thus, the optimal trading amount $\delta_a^\ast$ can be found from the following equation:
$$\left . \frac{\partial P}{\partial \delta_a} \right |_{\delta_a = \delta_a^\ast} = 0$$

Therefore,
$$\left . \frac{\partial P}{\partial \delta_a} \right |_{\delta_a = \delta_a^\ast} = \frac{r a a'}{(a + r \delta_a)^2} - 1 = 0$$
$$r a a' = (a + r \delta_a)^2$$
$$\delta_a=\frac{\sqrt{r a a'}-a}{r}$$

Note that the positive root is sufficient as we have to satisfy the constraint $\delta_a>=0$.

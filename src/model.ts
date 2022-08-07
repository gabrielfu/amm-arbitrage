import { ethers } from "ethers";

const BN_BASE = ethers.BigNumber.from(1000);
const ZERO = ethers.BigNumber.from(0);
const ONE = ethers.BigNumber.from(1);
const TWO = ethers.BigNumber.from(2);

/** sqrt() function for BN https://github.com/dholms/bn-sqrt */
function bnSqrt(num: ethers.BigNumber): ethers.BigNumber {
	if(num.lt(ZERO)) {
		throw new Error("Sqrt only works on non-negtiave inputs");
	}

	if(num.lt(TWO)) {
		return num;
	}

	const smallCand = bnSqrt(num.shr(2)).shl(1);
	const largeCand = smallCand.add(ONE);

	if (largeCand.mul(largeCand).gt(num)) {
		return smallCand;
	} else {
		return largeCand;
	}
}

/** Calculate the optimal trading amount for an arbitrage */
export function calculateAmountIn(a1: ethers.BigNumber, b1: ethers.BigNumber, a2: ethers.BigNumber, b2: ethers.BigNumber, c: ethers.BigNumber): ethers.BigNumber {
    let r = BN_BASE.sub(c);
    let a = a1.mul(b2).div(b1.mul(r).div(BN_BASE).add(b2));
    let a_ = a2.mul(b1).mul(r).div(BN_BASE).div(b1.mul(r).div(BN_BASE).add(b2));
    let d = bnSqrt(a.mul(a_).mul(r).div(BN_BASE)).sub(a).mul(BN_BASE).div(r);
    return d.gt(ZERO) ? d : ZERO;
}
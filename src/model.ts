import { BigNumber as BN } from "ethers";

const BN_BASE = BN.from(1000);
const ZERO = BN.from(0);
const ONE = BN.from(1);
const TWO = BN.from(2);

/** sqrt() function for BN https://github.com/dholms/bn-sqrt */
function bnSqrt(num: BN): BN {
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
export function calculateAmountIn(a1: BN, b1: BN, a2: BN, b2: BN, c: BN): BN {
    let r = BN_BASE.sub(c);
    let a = a1.mul(b2).div(b1.mul(r).div(BN_BASE).add(b2));
    let a_ = a2.mul(b1).mul(r).div(BN_BASE).div(b1.mul(r).div(BN_BASE).add(b2));
    let d = bnSqrt(a.mul(a_).mul(r).div(BN_BASE)).sub(a).mul(BN_BASE).div(r);
    return d.gt(ZERO) ? d : ZERO;
}
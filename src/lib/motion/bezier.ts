/**
 * @hyzer-labs/ui — cubic-bezier evaluator (specs/39-motion.md, Motion-R2).
 *
 * A real `(t: number) => number` evaluator for a CSS `cubic-bezier(x1, y1,
 * x2, y2)` curve — Newton–Raphson iteration on the curve's `x(t)`, falling
 * back to bisection where the slope is too shallow to converge, the same
 * approach browsers use for `cubic-bezier()` timing functions. No runtime
 * dependency: this is the well-known algorithm behind the `bezier-easing`
 * package, reimplemented in-house so the module stays dependency-free.
 *
 * Zero DOM/window access — safe to import and evaluate at any time,
 * including server-side.
 */

const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;
const SPLINE_TABLE_SIZE = 11;
const SAMPLE_STEP_SIZE = 1 / (SPLINE_TABLE_SIZE - 1);

function a(aA1: number, aA2: number): number {
	return 1 - 3 * aA2 + 3 * aA1;
}

function b(aA1: number, aA2: number): number {
	return 3 * aA2 - 6 * aA1;
}

function c(aA1: number): number {
	return 3 * aA1;
}

/** The curve's value (x or y) at parametric position `aT`, given the two
 * control-point coordinates on that axis. */
function calcBezier(aT: number, aA1: number, aA2: number): number {
	return ((a(aA1, aA2) * aT + b(aA1, aA2)) * aT + c(aA1)) * aT;
}

/** dx/dt (or dy/dt) at parametric position `aT`. */
function getSlope(aT: number, aA1: number, aA2: number): number {
	return 3 * a(aA1, aA2) * aT * aT + 2 * b(aA1, aA2) * aT + c(aA1);
}

function binarySubdivide(
	aX: number,
	initialA: number,
	initialB: number,
	mX1: number,
	mX2: number
): number {
	let currentX: number;
	let currentT: number;
	let aVal = initialA;
	let bVal = initialB;
	let i = 0;
	do {
		currentT = aVal + (bVal - aVal) / 2;
		currentX = calcBezier(currentT, mX1, mX2) - aX;
		if (currentX > 0) bVal = currentT;
		else aVal = currentT;
	} while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
	return currentT;
}

function newtonRaphsonIterate(aX: number, aGuessT: number, mX1: number, mX2: number): number {
	let guess = aGuessT;
	for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
		const currentSlope = getSlope(guess, mX1, mX2);
		if (currentSlope === 0) return guess;
		const currentX = calcBezier(guess, mX1, mX2) - aX;
		guess -= currentX / currentSlope;
	}
	return guess;
}

/**
 * Builds a JS easing evaluator for the CSS curve `cubic-bezier(x1, y1, x2,
 * y2)`. `x1`/`x2` must fall within `[0, 1]` (a requirement of the CSS
 * timing-function spec — the curve must be a function of x, i.e.
 * monotonically defined for every x in that range). `f(0) === 0` and
 * `f(1) === 1` always hold, since the curve's implicit endpoints are (0, 0)
 * and (1, 1).
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
	if (!(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)) {
		throw new Error(`cubicBezier: x1/x2 must be within [0, 1], got x1=${x1}, x2=${x2}`);
	}

	// Linear shortcut (x1 === y1 && x2 === y2 describes a straight line) —
	// skips the sample table / Newton-Raphson machinery entirely.
	if (x1 === y1 && x2 === y2) {
		return (t: number) => t;
	}

	// Precompute x(t) at fixed steps so getTForX can start from a close
	// guess instead of bisecting the whole [0, 1] range from scratch.
	const sampleValues = new Float64Array(SPLINE_TABLE_SIZE);
	for (let i = 0; i < SPLINE_TABLE_SIZE; i++) {
		sampleValues[i] = calcBezier(i * SAMPLE_STEP_SIZE, x1, x2);
	}

	function getTForX(aX: number): number {
		let intervalStart = 0;
		let currentSample = 1;
		const lastSample = SPLINE_TABLE_SIZE - 1;

		for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
			intervalStart += SAMPLE_STEP_SIZE;
		}
		--currentSample;

		// Linear interpolation within the bracketing sample interval, as a
		// starting guess for Newton-Raphson (or bisection, if the slope
		// there is too shallow to converge quickly).
		const dist =
			(aX - sampleValues[currentSample]) /
			(sampleValues[currentSample + 1] - sampleValues[currentSample]);
		const guessForT = intervalStart + dist * SAMPLE_STEP_SIZE;

		const initialSlope = getSlope(guessForT, x1, x2);
		if (initialSlope >= NEWTON_MIN_SLOPE) {
			return newtonRaphsonIterate(aX, guessForT, x1, x2);
		} else if (initialSlope === 0) {
			return guessForT;
		} else {
			return binarySubdivide(aX, intervalStart, intervalStart + SAMPLE_STEP_SIZE, x1, x2);
		}
	}

	return function bezierEasing(x: number): number {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		return calcBezier(getTForX(x), y1, y2);
	};
}

const CUBIC_BEZIER_RE =
	/cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/;

/** Parses the four control-point numbers out of a `cubic-bezier(…)` CSS
 * string — the parsing half of "derive from the token metadata, never
 * hand-copy" (Motion-R2). Throws on anything that isn't that exact shape. */
export function parseCubicBezier(css: string): [number, number, number, number] {
	const match = CUBIC_BEZIER_RE.exec(css);
	if (!match) {
		throw new Error(`parseCubicBezier: not a cubic-bezier() string: ${css}`);
	}
	const [, x1, y1, x2, y2] = match;
	return [Number(x1), Number(y1), Number(x2), Number(y2)];
}

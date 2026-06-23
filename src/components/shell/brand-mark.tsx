/**
 * BrandMark — a pixelated circle ring, rendered as crisp square "pixels" via an
 * SVG grid. Black/white: it draws in `currentColor`, so it follows the theme
 * (white on dark, black on light). Replaces the smooth brand ring with an 8-bit,
 * techy mark. `shapeRendering="crispEdges"` keeps the pixels sharp at any size.
 */

// 1 = a filled pixel. A symmetric 9×9 circle ring.
const RING = [
	"000111000",
	"011000110",
	"010000010",
	"100000001",
	"100000001",
	"100000001",
	"010000010",
	"011000110",
	"000111000",
];

const SIZE = RING.length;
const CELLS: Array<[number, number]> = [];
for (let y = 0; y < RING.length; y++) {
	const row = RING[y];
	for (let x = 0; x < row.length; x++) {
		if (row[x] === "1") CELLS.push([x, y]);
	}
}

export function BrandMark({ className }: { className?: string }) {
	return (
		<svg
			viewBox={`0 0 ${SIZE} ${SIZE}`}
			fill="currentColor"
			shapeRendering="crispEdges"
			className={className}
			aria-hidden="true"
		>
			{CELLS.map(([x, y]) => (
				<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
			))}
		</svg>
	);
}

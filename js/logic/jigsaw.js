// Jigsaw cuts for an n x n puzzle. Each piece has four edges, each one of
// 0 (flat: the puzzle's border), 1 (a tab sticking out) or -1 (a hole the
// neighbour's tab fits into). Neighbours always fit: where one piece has a
// tab, the piece beside it has the hole.

export function cutEdges(n, rand = Math.random) {
  const coin = () => (rand() < 0.5 ? 1 : -1);
  // across[y][x]: the edge below piece (x, y), from that piece's side
  // down[y][x]: the edge right of piece (x, y), from that piece's side
  const across = Array.from({ length: n }, () => Array.from({ length: n }, coin));
  const down = Array.from({ length: n }, () => Array.from({ length: n }, coin));
  const pieces = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      pieces.push({
        x,
        y,
        top: y === 0 ? 0 : -across[y - 1][x],
        right: x === n - 1 ? 0 : down[y][x],
        bottom: y === n - 1 ? 0 : across[y][x],
        left: x === 0 ? 0 : -down[y][x - 1],
      });
    }
  }
  return pieces;
}

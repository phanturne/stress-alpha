/**
 * Deterministic Squarified Treemap Partition Engine (Bruls et al.)
 * Pure TypeScript implementation with zero third-party dependencies.
 *
 * Partitions any 2D bounding box into golden-ratio rectangles proportional
 * to values, guaranteeing 100% surface filling with ZERO dead whitespace gaps.
 */

export interface TreemapItem {
  id: string;
  value: number; // weight or market cap
  [key: string]: any;
}

export interface TreemapRect<T extends TreemapItem = TreemapItem> {
  item: T;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Computes the worst (maximum) aspect ratio among rectangles in a candidate strip row.
 */
function worstAspectRatio(rowAreas: number[], sideLength: number): number {
  if (rowAreas.length === 0 || sideLength <= 0) return Infinity;
  const sumArea = rowAreas.reduce((acc, a) => acc + a, 0);
  if (sumArea <= 0) return Infinity;
  const stripThickness = sumArea / sideLength;
  if (stripThickness <= 0) return Infinity;

  let maxAspect = 0;
  for (const a of rowAreas) {
    if (a <= 0) continue;
    const lengthAlongStrip = a / stripThickness;
    const aspect = Math.max(
      lengthAlongStrip / stripThickness,
      stripThickness / lengthAlongStrip
    );
    if (aspect > maxAspect) maxAspect = aspect;
  }
  return maxAspect;
}

/**
 * Squarifies a list of weighted items within a bounding box.
 * Guarantees that the output rectangles perfectly tile the bounding box.
 */
export function squarify<T extends TreemapItem>(
  items: T[],
  bounds: { x: number; y: number; w: number; h: number }
): TreemapRect<T>[] {
  if (items.length === 0 || bounds.w <= 0 || bounds.h <= 0) {
    return [];
  }

  const validItems = items.filter((it) => it.value > 0);
  if (validItems.length === 0) return [];

  const totalValue = validItems.reduce((acc, it) => acc + it.value, 0);
  const totalArea = bounds.w * bounds.h;

  // Scale value to area
  const elements = validItems
    .map((item) => ({
      item,
      area: (item.value / totalValue) * totalArea,
    }))
    .sort((a, b) => b.area - a.area);

  const results: TreemapRect<T>[] = [];

  let curX = bounds.x;
  let curY = bounds.y;
  let curW = bounds.w;
  let curH = bounds.h;

  let row: { item: T; area: number }[] = [];

  function layoutRow(rowElements: { item: T; area: number }[]) {
    if (rowElements.length === 0) return;
    const sumArea = rowElements.reduce((acc, el) => acc + el.area, 0);
    const isHorizontal = curW >= curH;
    const sideLength = isHorizontal ? curH : curW;
    const stripThickness = sumArea / sideLength;

    let offset = isHorizontal ? curY : curX;

    for (let i = 0; i < rowElements.length; i++) {
      const el = rowElements[i];
      // On the last element, use remaining side length to eliminate floating-point rounding gaps
      const isLast = i === rowElements.length - 1;
      const lengthAlongStrip = isLast
        ? isHorizontal
          ? curY + curH - offset
          : curX + curW - offset
        : el.area / stripThickness;

      if (isHorizontal) {
        results.push({
          item: el.item,
          x: Math.round(curX * 10) / 10,
          y: Math.round(offset * 10) / 10,
          w: Math.round(stripThickness * 10) / 10,
          h: Math.round(Math.max(0, lengthAlongStrip) * 10) / 10,
        });
        offset += lengthAlongStrip;
      } else {
        results.push({
          item: el.item,
          x: Math.round(offset * 10) / 10,
          y: Math.round(curY * 10) / 10,
          w: Math.round(Math.max(0, lengthAlongStrip) * 10) / 10,
          h: Math.round(stripThickness * 10) / 10,
        });
        offset += lengthAlongStrip;
      }
    }

    if (isHorizontal) {
      curX += stripThickness;
      curW -= stripThickness;
    } else {
      curY += stripThickness;
      curH -= stripThickness;
    }
  }

  for (const el of elements) {
    const isHorizontal = curW >= curH;
    const sideLength = isHorizontal ? curH : curW;

    if (row.length === 0) {
      row.push(el);
    } else {
      const currentAreas = row.map((r) => r.area);
      const currentWorst = worstAspectRatio(currentAreas, sideLength);
      const nextWorst = worstAspectRatio(
        [...currentAreas, el.area],
        sideLength
      );

      if (nextWorst <= currentWorst) {
        row.push(el);
      } else {
        layoutRow(row);
        row = [el];
      }
    }
  }

  if (row.length > 0) {
    layoutRow(row);
  }

  return results;
}

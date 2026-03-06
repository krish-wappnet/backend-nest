export function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) {
    return [[]];
  }

  return arrays.reduce<T[][]>(
    (acc, curr) => {
      const next: T[][] = [];
      for (const prev of acc) {
        for (const item of curr) {
          next.push([...prev, item]);
        }
      }
      return next;
    },
    [[]],
  );
}

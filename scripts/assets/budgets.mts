// Asset budgets from the brief (A2, A8) and TRD §6. The validate script enforces them.
const MB = 1024 * 1024;

export interface Budget {
  maxBytes: number;
  maxTriangles?: number;
}

export const BUDGETS: Record<string, Budget> = {
  // A2: under 40k triangles and under 3 MB, passing the glTF Validator.
  shoe: { maxBytes: 3 * MB, maxTriangles: 40_000 },
  // A8: rigged character with idle and swing clips, under 2 MB.
  character: { maxBytes: 2 * MB },
};

/**
 * Picks the budget from the file name: `*shoe*` → shoe, `*character*` → character.
 * Development stand-ins under `dev/` are reported without a budget.
 */
export function budgetFor(file: string): Budget | undefined {
  const name = file.toLowerCase().replaceAll("\\", "/");
  if (name.includes("/dev/")) return undefined;
  return Object.entries(BUDGETS).find(([key]) => name.includes(key))?.[1];
}

/** Small batches avoid a single oversized monthly response; nothing is saved until every day validates. */
export async function generatePlanDays<T>(count: number, generateDay: (index: number) => Promise<T>): Promise<T[]> {
  const result: T[] = [];
  for (let i = 0; i < count; i += 3) {
    const indexes = Array.from({ length: Math.min(3, count - i) }, (_, offset) => i + offset);
    result.push(...await Promise.all(indexes.map(generateDay)));
  }
  return result;
}

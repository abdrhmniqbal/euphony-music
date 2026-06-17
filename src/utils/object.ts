export function moveArray<T>(
  arr: T[],
  movement: { fromIndex: number; toIndex: number },
) {
  const copy = [...arr]
  const moved = copy.splice(movement.fromIndex, 1)
  return copy.toSpliced(movement.toIndex, 0, moved[0]!)
}

export function shuffleArray<TData>(arr: TData[]) {
  const arrCpy = [...arr]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrCpy[j], arrCpy[i]] = [arrCpy[i]!, arrCpy[j]!]
  }
  return arrCpy
}

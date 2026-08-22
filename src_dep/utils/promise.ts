export async function bgWait(durationMs: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, durationMs))
}

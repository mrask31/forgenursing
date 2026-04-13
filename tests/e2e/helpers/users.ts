export function uniqueTestEmail(tag: string) {
  const stamp = Date.now();
  return `qa+${tag}_${stamp}@forgenursing.test`;
}

export const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

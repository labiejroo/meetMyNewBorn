/** Zamarkowane API: 600 ms i sukces, albo błąd gdy failMode. */
export function mockApi(failMode: boolean): Promise<{ ok: true }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (failMode ? reject(new Error("conflict")) : resolve({ ok: true })), 600);
  });
}

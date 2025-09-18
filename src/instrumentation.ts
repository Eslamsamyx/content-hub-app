export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // This code runs only on the server
    const { initializeApp } = await import('./lib/app-init')
    await initializeApp()
  }
}
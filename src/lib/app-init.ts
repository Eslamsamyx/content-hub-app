import EmailService from './email-service'

/**
 * Initialize application services
 * This should be called once when the application starts
 */
export async function initializeApp() {
  console.log('Initializing application services...')
  
  // Initialize email service
  await EmailService.initialize()
  
  // Add other service initializations here as needed
  // e.g., cache, job queues, etc.
  
  console.log('Application services initialized')
}

// Call this in development to initialize on module load
if (process.env.NODE_ENV === 'development') {
  initializeApp().catch(console.error)
}
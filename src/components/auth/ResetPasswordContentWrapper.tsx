'use client'

import { Suspense } from 'react'
import ResetPasswordContent from './ResetPasswordContent'

export default function ResetPasswordContentWrapper({ lng }: { lng: string }) {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto p-6">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center items-center">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-3 text-white">Loading...</span>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent lng={lng} />
    </Suspense>
  )
}
'use client'

import { SignupLayout } from '@/components/signup/SignupLayout'
import { SignupForm } from '@/components/signup/SignupForm'

export default function SignupPage() {
  return (
    <SignupLayout>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        {/* Background gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px]" />

        {/* Form */}
        <div className="relative z-10 w-full flex justify-center px-6">
          <SignupForm />
        </div>
      </div>
    </SignupLayout>
  )
}

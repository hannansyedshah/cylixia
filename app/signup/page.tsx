import { Layout } from '@/components/Layout'
import { SignupForm } from '@/components/SignupForm'

export default function SignupPage() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-rstudio/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10 animate-fade-in-up">
          <SignupForm />
        </div>
      </div>
    </Layout>
  )
}


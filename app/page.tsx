import Link from 'next/link'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { BarChart3, Code2, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-rstudio/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-7xl font-bold mb-6 text-darktext dark:text-white animate-fade-in-up">
              c<span className="text-rstudio animate-pulse inline-block">R</span>eate
            </h1>
            <p className="text-3xl text-gray-600 dark:text-gray-300 mb-8 animate-fade-in-up animation-delay-200 font-semibold">
              Turn your research questions into R code and visuals
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-400 leading-relaxed">
              An AI-driven R data visualization assistant for researchers. Upload your datasets, 
              ask questions, and instantly see generated R code with beautiful plots.
            </p>
            <div className="flex justify-center space-x-4 animate-fade-in-up animation-delay-600">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center transform hover:scale-105 transition-all duration-300 hover:shadow-rstudio/20 border border-transparent hover:border-rstudio/30 group">
              <div className="bg-gradient-to-br from-rstudio to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-bounce shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-darktext dark:text-white">
                AI-Powered
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Ask questions in plain English and get instant R code suggestions tailored to your data
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center transform hover:scale-105 transition-all duration-300 hover:shadow-purple-500/20 border border-transparent hover:border-purple-500/30 group animation-delay-200">
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-bounce shadow-lg">
                <Code2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-darktext dark:text-white">
                Clean R Code
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                View, edit, and run professional R code with syntax highlighting and Monaco editor
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center transform hover:scale-105 transition-all duration-300 hover:shadow-blue-500/20 border border-transparent hover:border-blue-500/30 group animation-delay-400">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-bounce shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-darktext dark:text-white">
                Beautiful Visuals
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Generate publication-ready plots and charts instantly from your research data
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="bg-gradient-to-r from-rstudio via-blue-600 to-purple-600 text-white rounded-3xl p-12 text-center max-w-3xl mx-auto shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4 animate-fade-in-up">
                Ready to accelerate your research?
              </h2>
              <p className="text-xl mb-8 opacity-90 animate-fade-in-up animation-delay-200">
                Join researchers who are saving hours on data visualization
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-white text-rstudio hover:bg-gray-100 hover:text-rstudio text-lg px-8 py-6 shadow-xl">
                  Start Creating Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}


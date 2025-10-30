import Link from 'next/link'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Code2, Sparkles, Upload, MessageSquare, BarChart3, History } from 'lucide-react'

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
              c<span className="text-rstudio animate-gradient inline-block">R</span>eate
            </h1>
            <p className="text-3xl text-gray-600 dark:text-gray-300 mb-8 animate-fade-in-up animation-delay-200 font-semibold">
              From question to insight—R code and visuals in seconds
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-400 leading-relaxed">
              Upload a dataset, ask in plain English, and get clean R code with publication‑ready plots—fast, transparent, and reproducible.
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
              <div className="bg-gradient-to-br from-rstudio to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-float group-hover:animate-bounce">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-darktext dark:text-white">
                Ask. Get Answers.
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Describe your goal. Receive tailored R code that fits your data and intent.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center transform hover:scale-105 transition-all duration-300 hover:shadow-purple-500/20 border border-transparent hover:border-purple-500/30 group animation-delay-200">
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-float group-hover:animate-bounce">
                <Code2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-darktext dark:text-white">
                Clean, Editable R Code
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Transparent outputs you can tweak, run, and reproduce—no black boxes.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center transform hover:scale-105 transition-all duration-300 hover:shadow-blue-500/20 border border-transparent hover:border-blue-500/30 group animation-delay-400">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-float group-hover:animate-bounce">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-darktext dark:text-white">
                Your Data Stays Yours
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We secure your data—private by default. Your files aren’t shared or used to train models.
              </p>
            </div>
          </div>
        </div>

        {/* Example Section */}
        <div className="container mx-auto px-4 pb-28 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-darktext dark:text-white mb-3 animate-fade-in-up">See it in action</h2>
              <p className="text-gray-600 dark:text-gray-300 animate-fade-in-up animation-delay-200">Four simple steps from raw data to publication‑ready visuals.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-stretch">
              {/* Steps */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border hover:border-rstudio/40 shadow-sm transition-all group">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-rstudio/10 text-rstudio flex items-center justify-center mr-4 group-hover:animate-bounce">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-darktext dark:text-white">Upload your data</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">CSV or spreadsheet—cReate previews columns and types automatically.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border hover:border-rstudio/40 shadow-sm transition-all group">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center mr-4 group-hover:animate-bounce">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-darktext dark:text-white">Ask in plain English</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Describe the plot or analysis you need. No R experience required.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border hover:border-purple-500/40 shadow-sm transition-all group">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-purple-600/10 text-purple-600 flex items-center justify-center mr-4 group-hover:animate-bounce">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-darktext dark:text-white">Review editable R code</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Transparent, clean code you can tweak, run, and reuse.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border hover:border-cyan-500/40 shadow-sm transition-all group">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-cyan-600/10 text-cyan-600 flex items-center justify-center mr-4 group-hover:animate-bounce">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-darktext dark:text-white">Get beautiful visuals</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Publication‑ready plots with consistent themes and accessibility in mind.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 pt-2">
                  <History className="w-4 h-4 mr-2 text-darktext dark:text-white" />
                  <span>Everything autosaves. Browse full version history anytime.</span>
                </div>
              </div>

              {/* Demo Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-6 flex flex-col">
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Example</div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border mb-4">
                  <div className="text-sm text-gray-700 dark:text-gray-200">Prompt</div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">“Make a bar chart of average mpg by cylinder count.”</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 flex-1">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border overflow-hidden">
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">Generated R</div>
                    <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
{`library(dplyr)
library(ggplot2)
mtcars %>%
  group_by(cyl) %>%
  summarise(avg_mpg = mean(mpg)) %>%
  ggplot(aes(x = factor(cyl), y = avg_mpg, fill = factor(cyl))) +
  geom_col() +
  theme_minimal() +
  labs(x = 'Cylinders', y = 'Average MPG')`}
                    </pre>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border flex items-center justify-center">
                    {/* Inline demo chart (SVG) */}
                    <svg viewBox="0 0 220 140" className="w-full h-32">
                      <defs>
                        <linearGradient id="barGrad" x1="0" x2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                      <rect x="0" y="0" width="220" height="140" rx="8" fill="transparent" />
                      <g transform="translate(30,10)">
                        <line x1="0" y1="120" x2="170" y2="120" stroke="#94a3b8" strokeWidth="1" />
                        <g className="animate-fade-in-up">
                          <rect x="10" y="60" width="30" height="60" rx="4" fill="url(#barGrad)" className="transform origin-bottom group-hover:scale-y-105" />
                          <rect x="70" y="40" width="30" height="80" rx="4" fill="url(#barGrad)" className="transform origin-bottom animate-float" />
                          <rect x="130" y="50" width="30" height="70" rx="4" fill="url(#barGrad)" className="transform origin-bottom" />
                        </g>
                        <text x="15" y="135" fontSize="10" fill="#94a3b8">4</text>
                        <text x="75" y="135" fontSize="10" fill="#94a3b8">6</text>
                        <text x="135" y="135" fontSize="10" fill="#94a3b8">8</text>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
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


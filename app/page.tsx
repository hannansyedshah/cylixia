'use client'

import Link from 'next/link'
import { HomeLayout } from '@/components/homepage/HomeLayout'
import { Button } from '@/components/ui/button'
import { Mascot } from '@/components/homepage/Mascot'
import { TextRotate } from '@/components/homepage/TextRotate'
import { TypewriterText } from '@/components/homepage/typewriter-text'
import { GlowingEffect } from '@/components/homepage/glowing-effect'
import {
  ArrowRight,
  Upload,
  MessageSquare,
  BarChart3,
  Sparkles,
  Users,
  Lock,
  History,
  Code2,
  Share2,
  Check,
  Shield,
  FileCheck,
  Zap
} from 'lucide-react'

export default function Home() {
  const words = ['simple', 'instant', 'powerful', 'magical']

  return (
    <HomeLayout>
      <div className="min-h-screen bg-black text-white">
        {/* Hero */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px]" />

          <div className="container mx-auto px-6 py-12 md:py-16 relative z-10">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center max-w-6xl mx-auto">
              {/* Left side - Text content */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-zinc-400">in beta</span>
                </div>

                {/* Cylixia Title with Typewriter */}
                <h1
                  className="text-5xl sm:text-6xl md:text-7xl font-semibold mb-6 text-left"
                  style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                >
                  <TypewriterText
                    text="Cylixia"
                    speed={100}
                    cursor="|"
                    className="bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent"
                    cursorClassName="animate-blink text-emerald-400"
                  />
                </h1>

                {/* Mascot + Tagline */}
                <div className="flex items-center gap-4 mb-6 justify-center lg:justify-start">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150" />
                    <Mascot size={64} className="relative drop-shadow-2xl" />
                  </div>
                  <div className="text-2xl md:text-3xl">
                    <span className="text-zinc-500">Data analysis made </span>
                    <TextRotate
                      words={words}
                      className="text-emerald-400 font-medium"
                    />
                  </div>
                </div>

                {/* Subtitle */}
                <p className="text-lg text-zinc-400 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Describe what you need in plain English. Get publication-ready R code and visualizations instantly.
                </p>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 justify-center lg:justify-start">
                  <Link href="/signup">
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 h-12 text-base font-medium rounded-full">
                      Get started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 px-8 h-12 text-base font-medium rounded-full border border-zinc-800">
                      Sign in
                    </Button>
                  </Link>
                </div>

                {/* Trust */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500 justify-center lg:justify-start">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Free to start</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>HIPAA ready</span>
                  </div>
                </div>
              </div>

              {/* Right side - Demo mockup */}
              <div className="relative">
                <div className="absolute -inset-4 bg-emerald-500/5 blur-3xl rounded-full" />
                <div className="relative rounded-xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-2xl">
                  {/* Window header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    <span className="ml-3 text-xs text-zinc-600 font-mono">cylixia workspace</span>
                  </div>

                  {/* Chat prompt */}
                  <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-zinc-300">
                          &ldquo;Show me a scatter plot of horsepower vs mpg, colored by cylinders&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Generated code */}
                  <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Code2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-zinc-500 font-mono">generated.R</span>
                    </div>
                    <pre className="text-xs text-zinc-400 font-mono leading-relaxed overflow-x-auto">
{`ggplot(mtcars, aes(hp, mpg, color = factor(cyl))) +
  geom_point(size = 3, alpha = 0.8) +
  scale_color_brewer(palette = "Set2") +
  labs(x = "Horsepower", y = "MPG", color = "Cylinders") +
  theme_minimal()`}
                    </pre>
                  </div>

                  {/* Chart preview */}
                  <div className="p-4 bg-zinc-950/30">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-zinc-500">Output</span>
                    </div>
                    {/* Scatter plot visualization */}
                    <div className="relative h-32 flex items-end justify-center gap-1">
                      {/* Y axis */}
                      <div className="absolute left-0 top-0 bottom-4 w-8 flex flex-col justify-between items-end pr-2 text-[9px] text-zinc-600">
                        <span>35</span>
                        <span>25</span>
                        <span>15</span>
                      </div>
                      {/* Plot area */}
                      <div className="relative ml-8 flex-1 h-28 border-l border-b border-zinc-700">
                        {/* Scatter points - 4 cyl (teal) */}
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-teal-400" style={{ left: '15%', bottom: '75%' }} />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-teal-400" style={{ left: '20%', bottom: '80%' }} />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-teal-400" style={{ left: '25%', bottom: '70%' }} />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-teal-400" style={{ left: '18%', bottom: '85%' }} />
                        {/* 6 cyl (orange) */}
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-orange-400" style={{ left: '35%', bottom: '55%' }} />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-orange-400" style={{ left: '40%', bottom: '50%' }} />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-orange-400" style={{ left: '45%', bottom: '45%' }} />
                        {/* 8 cyl (pink) */}
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-pink-400" style={{ left: '60%', bottom: '35%' }} />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-pink-400" style={{ left: '70%', bottom: '30%' }} />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-pink-400" style={{ left: '75%', bottom: '25%' }} />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-pink-400" style={{ left: '85%', bottom: '20%' }} />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-pink-400" style={{ left: '80%', bottom: '28%' }} />
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-zinc-500">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-teal-400" />
                        <span>4 cyl</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        <span>6 cyl</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-pink-400" />
                        <span>8 cyl</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-28 border-t border-zinc-800/50">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Three steps to insight
              </h2>
              <p className="text-zinc-400">
                No R experience needed. Just describe what you want.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Upload,
                  step: '01',
                  title: 'Upload',
                  desc: 'Drop your CSV or spreadsheet. We auto-detect columns and types.'
                },
                {
                  icon: MessageSquare,
                  step: '02',
                  title: 'Describe',
                  desc: 'Tell us what analysis or visualization you need in plain English.'
                },
                {
                  icon: BarChart3,
                  step: '03',
                  title: 'Generate',
                  desc: 'Get clean R code and publication-ready plots instantly.'
                },
              ].map((item, i) => (
                <div key={i} className="relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors group">
                  <span className="absolute top-5 right-5 text-xs font-mono text-zinc-700">{item.step}</span>
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 group-hover:bg-emerald-500/20 transition-colors">
                    <item.icon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-28 border-t border-zinc-800/50">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built for researchers
              </h2>
              <p className="text-zinc-400">
                Enterprise-grade security meets intuitive data analysis.
              </p>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-12 gap-4 max-w-6xl mx-auto">
              {/* NIST Compliant - Large */}
              <li className="md:[grid-area:1/1/2/7] min-h-[14rem] list-none">
                <div className="relative h-full rounded-2xl border border-zinc-800 p-2">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={2}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/80 p-6">
                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="w-fit rounded-lg border border-zinc-700 bg-zinc-800 p-2">
                        <Shield className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">NIST 800-53 Compliant</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Full compliance with federal security standards. AES-256 encryption at rest, TLS 1.3 in transit, and SOC 2 Type II certified infrastructure.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* HIPAA Ready */}
              <li className="md:[grid-area:1/7/2/13] min-h-[14rem] list-none">
                <div className="relative h-full rounded-2xl border border-zinc-800 p-2">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={2}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/80 p-6">
                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="w-fit rounded-lg border border-zinc-700 bg-zinc-800 p-2">
                        <FileCheck className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">HIPAA Ready</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          BAA available for healthcare research. PHI handling protocols, audit logging, and access controls built for medical data compliance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* AI-Powered - Tall */}
              <li className="md:[grid-area:2/1/4/5] min-h-[14rem] list-none">
                <div className="relative h-full rounded-2xl border border-zinc-800 p-2">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={2}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/80 p-6">
                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="w-fit rounded-lg border border-zinc-700 bg-zinc-800 p-2">
                        <Sparkles className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">AI-Powered Analysis</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Describe your analysis in plain English. Our AI understands statistical methods, generates optimized R code, and suggests the best visualizations for your data.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* Real-time Collaboration */}
              <li className="md:[grid-area:2/5/3/9] min-h-[14rem] list-none">
                <div className="relative h-full rounded-2xl border border-zinc-800 p-2">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={2}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/80 p-6">
                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="w-fit rounded-lg border border-zinc-700 bg-zinc-800 p-2">
                        <Users className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">Team Collaboration</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Work together in real-time. Share datasets, review code changes, and publish results with granular permissions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* Zero Data Retention */}
              <li className="md:[grid-area:2/9/3/13] min-h-[14rem] list-none">
                <div className="relative h-full rounded-2xl border border-zinc-800 p-2">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={2}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/80 p-6">
                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="w-fit rounded-lg border border-zinc-700 bg-zinc-800 p-2">
                        <Lock className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">Zero Data Retention</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Your data is never used for AI training. Auto-delete options and full data portability included.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* Version History & Instant Processing */}
              <li className="md:[grid-area:3/5/4/9] min-h-[14rem] list-none">
                <div className="relative h-full rounded-2xl border border-zinc-800 p-2">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={2}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/80 p-6">
                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="w-fit rounded-lg border border-zinc-700 bg-zinc-800 p-2">
                        <History className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">Full Version History</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Every change tracked. Restore any previous version, compare iterations, and maintain complete audit trails.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* Instant Processing */}
              <li className="md:[grid-area:3/9/4/13] min-h-[14rem] list-none">
                <div className="relative h-full rounded-2xl border border-zinc-800 p-2">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={2}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-zinc-900/80 p-6">
                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <div className="w-fit rounded-lg border border-zinc-700 bg-zinc-800 p-2">
                        <Zap className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">Instant Processing</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Sub-second code generation. Handle datasets up to 10GB with optimized cloud compute.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Watch in Action */}
        <section className="py-28 border-t border-zinc-800/50">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  See it in action
                </h2>
                <p className="text-zinc-400">
                  Watch how Cylixia transforms your research workflow in under 2 minutes.
                </p>
              </div>

              {/* Video placeholder */}
              <div className="relative aspect-video rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/25">
                    <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm text-zinc-400">
                  <span className="px-2 py-1 rounded bg-zinc-800/80 text-xs">1:47</span>
                  <span>Product Demo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Support */}
        <section className="py-28 border-t border-zinc-800/50">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Sales */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">
                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Talk to Sales</h3>
                  <p className="text-sm text-zinc-500 mb-4">
                    Get a personalized demo and discuss enterprise pricing.
                  </p>
                  <a href="mailto:sales@cylixia.com" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                    sales@cylixia.com →
                  </a>
                </div>

                {/* Support */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">
                    <Zap className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Technical Support</h3>
                  <p className="text-sm text-zinc-500 mb-4">
                    Get help from our team. Average response time under 2 hours.
                  </p>
                  <a href="mailto:support@cylixia.com" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                    support@cylixia.com →
                  </a>
                </div>

                {/* Documentation */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">
                    <Code2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Documentation</h3>
                  <p className="text-sm text-zinc-500 mb-4">
                    Guides, API reference, and examples to get you started.
                  </p>
                  <a href="/docs" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                    Read the docs →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-28 border-t border-zinc-800/50">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <Mascot size={72} className="mx-auto mb-8" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Start analyzing today
              </h2>
              <p className="text-zinc-400 mb-8">
                Join researchers who are saving hours on data visualization.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 h-12 text-base font-medium rounded-full">
                  Get started free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 border-t border-zinc-800/50">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <Mascot size={18} />
                <span className="font-medium">Cylixia</span>
              </div>
              <span>© 2024</span>
            </div>
          </div>
        </footer>
      </div>
    </HomeLayout>
  )
}

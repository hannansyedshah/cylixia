'use client'

import { useState } from 'react'
import { Shield, Check, AlertTriangle, Lock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NistComplianceModalProps {
  projectName: string
  onAcknowledge: () => void
}

export function NistComplianceModal({
  projectName,
  onAcknowledge
}: NistComplianceModalProps) {
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState({
    phi: false,
    audit: false,
    encryption: false,
    responsibility: false
  })

  const allWarningsAcknowledged = Object.values(acknowledgedWarnings).every(v => v)

  const handleAcknowledge = () => {
    localStorage.setItem(`nist-acknowledged-${projectName}`, 'true')
    onAcknowledge()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div className="relative w-full max-w-[1400px]">
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-emerald-600/20 rounded-2xl blur-xl" />
        <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 bg-gradient-to-r from-teal-900/50 to-emerald-900/50 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-600/20 flex items-center justify-center border border-teal-500/30">
                <Shield className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  NIST Compliance Requirements
                </h2>
                <p className="text-sm text-zinc-400 mt-1 font-medium">
                  Project: {projectName} - Please acknowledge all 4 requirements
                </p>
              </div>
            </div>
          </div>

          {/* 2x2 Grid of Requirements */}
          <div className="p-8 bg-zinc-900">
            <div className="grid grid-cols-2 gap-4 max-w-6xl mx-auto">
              {/* Top Left: PHI Warning */}
              <div className="bg-zinc-800/50 rounded-xl border border-red-500/30 p-5 hover:border-red-500/50 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    PHI Handling
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                  System auto-detects and redacts PHI (names, DOB, SSN, etc.). <span className="font-bold text-red-400">You must verify all sensitive fields</span>. Redacted data shared with AI models.
                </p>
                <label className="flex items-center gap-2 cursor-pointer group p-2 rounded-lg hover:bg-zinc-700/50">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    acknowledgedWarnings.phi
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-zinc-600 group-hover:border-emerald-500/50'
                  }`}>
                    {acknowledgedWarnings.phi && <Check className="w-4 h-4 text-black" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={acknowledgedWarnings.phi}
                    onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, phi: e.target.checked }))}
                    className="sr-only"
                  />
                  <span className="text-xs font-medium text-zinc-300">
                    I acknowledge PHI redaction requirements
                  </span>
                </label>
              </div>

              {/* Top Right: Audit Trail */}
              <div className="bg-zinc-800/50 rounded-xl border border-yellow-500/30 p-5 hover:border-yellow-500/50 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Audit & Logging
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                  All uploads, AI interactions, and accesses logged for NIST compliance (timestamps, IDs, activities). <span className="font-bold text-yellow-400">Do not upload without consent</span>.
                </p>
                <label className="flex items-center gap-2 cursor-pointer group p-2 rounded-lg hover:bg-zinc-700/50">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    acknowledgedWarnings.audit
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-zinc-600 group-hover:border-emerald-500/50'
                  }`}>
                    {acknowledgedWarnings.audit && <Check className="w-4 h-4 text-black" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={acknowledgedWarnings.audit}
                    onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, audit: e.target.checked }))}
                    className="sr-only"
                  />
                  <span className="text-xs font-medium text-zinc-300">
                    I consent to audit trail logging
                  </span>
                </label>
              </div>

              {/* Bottom Left: Encryption */}
              <div className="bg-zinc-800/50 rounded-xl border border-blue-500/30 p-5 hover:border-blue-500/50 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Encryption & Transmission
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                  Data encrypted in transit (TLS 1.3) and at rest (AES-256). <span className="font-bold text-blue-400">Redacted data transmitted over secure channels</span>. Original data stays secure.
                </p>
                <label className="flex items-center gap-2 cursor-pointer group p-2 rounded-lg hover:bg-zinc-700/50">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    acknowledgedWarnings.encryption
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-zinc-600 group-hover:border-emerald-500/50'
                  }`}>
                    {acknowledgedWarnings.encryption && <Check className="w-4 h-4 text-black" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={acknowledgedWarnings.encryption}
                    onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, encryption: e.target.checked }))}
                    className="sr-only"
                  />
                  <span className="text-xs font-medium text-zinc-300">
                    I understand encryption protocols
                  </span>
                </label>
              </div>

              {/* Bottom Right: Legal Responsibility */}
              <div className="bg-zinc-800/50 rounded-xl border border-red-500/30 p-5 hover:border-red-500/50 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Legal Responsibility
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                  <span className="font-bold text-red-400">YOU ARE SOLELY RESPONSIBLE</span> for NIST compliance. Platform makes <span className="font-bold text-red-400">NO GUARANTEES</span>. We assume <span className="font-bold text-red-400">NO LIABILITY</span> for violations.
                </p>
                <label className="flex items-center gap-2 cursor-pointer group p-2 rounded-lg hover:bg-zinc-700/50">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    acknowledgedWarnings.responsibility
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-zinc-600 group-hover:border-emerald-500/50'
                  }`}>
                    {acknowledgedWarnings.responsibility && <Check className="w-4 h-4 text-black" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={acknowledgedWarnings.responsibility}
                    onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, responsibility: e.target.checked }))}
                    className="sr-only"
                  />
                  <span className="text-xs font-medium text-zinc-300">
                    I accept full legal responsibility
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-4 bg-zinc-800/50 border-t border-zinc-700">
            <div className="flex items-center gap-3">
              <CheckCircle className={`w-6 h-6 ${allWarningsAcknowledged ? 'text-emerald-500' : 'text-zinc-600'}`} />
              <div>
                <p className="text-sm font-bold text-white">
                  {Object.values(acknowledgedWarnings).filter(v => v).length} of 4 Requirements Acknowledged
                </p>
                {!allWarningsAcknowledged && (
                  <p className="text-xs text-zinc-500">
                    Please check all boxes to continue
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={handleAcknowledge}
              disabled={!allWarningsAcknowledged}
              className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 ${
                allWarningsAcknowledged
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg hover:scale-105'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-5 h-5 mr-2 inline" />
              Continue to Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { X, Shield, Check, AlertTriangle, Lock, FileText, CheckCircle } from 'lucide-react'
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
    // Store acknowledgment in localStorage for this project
    localStorage.setItem(`nist-acknowledged-${projectName}`, 'true')
    onAcknowledge()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-[96vw] max-w-[1400px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                NIST Compliance Requirements
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                Project: {projectName} • Please acknowledge all 4 requirements
              </p>
            </div>
          </div>
        </div>

        {/* 2x2 Grid of Requirements - No Scrolling */}
        <div className="p-8 bg-gray-50 dark:bg-gray-900/50">
          <div className="grid grid-cols-2 gap-4 max-w-6xl mx-auto">
            {/* Top Left: PHI Warning */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-red-300 dark:border-red-800 p-5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  PHI Handling
                </h3>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                System auto-detects and redacts PHI (names, DOB, SSN, etc.). <span className="font-bold text-red-600 dark:text-red-400">You must verify all sensitive fields</span>. Redacted data shared with AI models.
              </p>
              <label className="flex items-center gap-2 cursor-pointer group p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  acknowledgedWarnings.phi 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-400 dark:border-gray-500 group-hover:border-green-400'
                }`}>
                  {acknowledgedWarnings.phi && <Check className="w-4 h-4 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={acknowledgedWarnings.phi}
                  onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, phi: e.target.checked }))}
                  className="sr-only"
                />
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  I acknowledge PHI redaction requirements
                </span>
              </label>
            </div>

            {/* Top Right: Audit Trail */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-amber-300 dark:border-amber-800 p-5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  Audit & Logging
                </h3>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                All uploads, AI interactions, and accesses logged for NIST compliance (timestamps, IDs, activities). <span className="font-bold">Do not upload without consent</span>.
              </p>
              <label className="flex items-center gap-2 cursor-pointer group p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  acknowledgedWarnings.audit 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-400 dark:border-gray-500 group-hover:border-green-400'
                }`}>
                  {acknowledgedWarnings.audit && <Check className="w-4 h-4 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={acknowledgedWarnings.audit}
                  onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, audit: e.target.checked }))}
                  className="sr-only"
                />
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  I consent to audit trail logging
                </span>
              </label>
            </div>

            {/* Bottom Left: Encryption */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-300 dark:border-blue-800 p-5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  Encryption & Transmission
                </h3>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                Data encrypted in transit (TLS 1.3) and at rest (AES-256). <span className="font-bold">Redacted data transmitted over secure channels</span>. Original data stays secure.
              </p>
              <label className="flex items-center gap-2 cursor-pointer group p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  acknowledgedWarnings.encryption 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-400 dark:border-gray-500 group-hover:border-green-400'
                }`}>
                  {acknowledgedWarnings.encryption && <Check className="w-4 h-4 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={acknowledgedWarnings.encryption}
                  onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, encryption: e.target.checked }))}
                  className="sr-only"
                />
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  I understand encryption protocols
                </span>
              </label>
            </div>

            {/* Bottom Right: Legal Responsibility */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-red-400 dark:border-red-700 p-5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  Legal Responsibility
                </h3>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                <span className="font-bold text-red-600 dark:text-red-400">YOU ARE SOLELY RESPONSIBLE</span> for NIST compliance. Platform makes <span className="font-bold">NO GUARANTEES</span>. We assume <span className="font-bold">NO LIABILITY</span> for violations.
              </p>
              <label className="flex items-center gap-2 cursor-pointer group p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  acknowledgedWarnings.responsibility 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-400 dark:border-gray-500 group-hover:border-green-400'
                }`}>
                  {acknowledgedWarnings.responsibility && <Check className="w-4 h-4 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={acknowledgedWarnings.responsibility}
                  onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, responsibility: e.target.checked }))}
                  className="sr-only"
                />
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  I accept full legal responsibility
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 border-t-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <CheckCircle className={`w-6 h-6 ${allWarningsAcknowledged ? 'text-green-500' : 'text-gray-400 dark:text-gray-600'}`} />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {Object.values(acknowledgedWarnings).filter(v => v).length} of 4 Requirements Acknowledged
              </p>
              {!allWarningsAcknowledged && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Please check all boxes to continue
                </p>
              )}
            </div>
          </div>
          <Button 
            onClick={handleAcknowledge}
            disabled={!allWarningsAcknowledged}
            className={`px-8 py-3 rounded-lg font-bold shadow-lg transition-all duration-200 ${
              allWarningsAcknowledged
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5 mr-2 inline" />
            Continue to Project
          </Button>
        </div>
      </div>
    </div>
  )
}


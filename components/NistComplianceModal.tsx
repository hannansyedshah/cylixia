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
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[96vw] max-w-[1200px] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-850 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                NIST Compliance Requirements
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                Project: {projectName}
              </p>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="px-8 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                Required Compliance Acknowledgments
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300 mt-1 leading-relaxed">
                Before working with NIST-compliant data, please read and acknowledge all compliance requirements below.
              </p>
            </div>
          </div>
        </div>

        {/* Warnings Content */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* PHI Warning */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Protected Health Information (PHI) Handling
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    This system automatically detects and redacts PHI fields (names, DOB, SSN, MRN, addresses, etc.). 
                    However, <span className="font-bold text-red-600 dark:text-red-400">you must verify that all sensitive fields are properly identified</span>. 
                    Redacted data will be randomized and shared with AI models for analysis purposes.
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      acknowledgedWarnings.phi 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 dark:border-gray-600 group-hover:border-green-400'
                    }`}>
                      {acknowledgedWarnings.phi && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={acknowledgedWarnings.phi}
                      onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, phi: e.target.checked }))}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      I understand and acknowledge PHI redaction requirements
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Audit Trail Warning */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-amber-200 dark:border-amber-800 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Audit Trail & Access Logging
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    All data uploads, AI interactions, and file accesses are logged for NIST compliance. 
                    These audit trails include timestamps, user IDs, and activity types. 
                    <span className="font-bold"> Do not upload data if you do not consent to audit logging.</span>
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      acknowledgedWarnings.audit 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 dark:border-gray-600 group-hover:border-green-400'
                    }`}>
                      {acknowledgedWarnings.audit && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={acknowledgedWarnings.audit}
                      onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, audit: e.target.checked }))}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      I consent to audit trail logging of all data activities
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Encryption Warning */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Encryption & Data Transmission
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    All data is encrypted in transit (TLS 1.3) and at rest (AES-256). 
                    When shared with AI models, <span className="font-bold">redacted and randomized data is transmitted over secure channels</span>. 
                    Original data never leaves your secure environment.
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      acknowledgedWarnings.encryption 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 dark:border-gray-600 group-hover:border-green-400'
                    }`}>
                      {acknowledgedWarnings.encryption && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={acknowledgedWarnings.encryption}
                      onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, encryption: e.target.checked }))}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      I understand encryption and data transmission protocols
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Legal Responsibility Warning */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-red-300 dark:border-red-700 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Legal Disclaimer & Responsibility
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    <span className="font-bold text-red-600 dark:text-red-400">YOU ARE SOLELY RESPONSIBLE</span> for ensuring NIST compliance of uploaded data. 
                    This platform provides automated tools but makes <span className="font-bold">NO GUARANTEES</span> regarding compliance. 
                    We assume <span className="font-bold">NO LIABILITY</span> for compliance violations, data breaches, or regulatory issues arising from your use of this service.
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      acknowledgedWarnings.responsibility 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 dark:border-gray-600 group-hover:border-green-400'
                    }`}>
                      {acknowledgedWarnings.responsibility && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={acknowledgedWarnings.responsibility}
                      onChange={(e) => setAcknowledgedWarnings(prev => ({ ...prev, responsibility: e.target.checked }))}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      I accept full legal responsibility for compliance verification
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle className={`w-5 h-5 ${allWarningsAcknowledged ? 'text-green-500' : 'text-gray-400'}`} />
            <span>
              <span className="font-semibold">{Object.values(acknowledgedWarnings).filter(v => v).length}</span> of 4 requirements acknowledged
            </span>
          </div>
          <Button 
            onClick={handleAcknowledge}
            disabled={!allWarningsAcknowledged}
            className={`px-6 py-2.5 rounded-lg font-semibold shadow-lg transition-all duration-200 ${
              allWarningsAcknowledged
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Continue to Project
          </Button>
        </div>
      </div>
    </div>
  )
}


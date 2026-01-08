'use client'

import { useState, useEffect } from 'react'
import { X, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type CalculatorTool = 'iv-flow' | 'drops-per-minute' | 'weight-based' | 'safe-dose'

interface MedicalMathCalculatorProps {
  isOpen: boolean
  onClose: () => void
}

export default function MedicalMathCalculator({ isOpen, onClose }: MedicalMathCalculatorProps) {
  const [activeTool, setActiveTool] = useState<CalculatorTool>('iv-flow')
  
  // IV Flow Rate (mL/hr)
  const [totalVolume, setTotalVolume] = useState('')
  const [totalTime, setTotalTime] = useState('')
  const [ivFlowResult, setIvFlowResult] = useState<number | null>(null)

  // Drops per Minute
  const [dropsVolume, setDropsVolume] = useState('')
  const [dropsTime, setDropsTime] = useState('')
  const [dropFactor, setDropFactor] = useState('15') // Default 15 gtt/mL
  const [dropsResult, setDropsResult] = useState<number | null>(null)

  // Weight-Based Dose
  const [medDose, setMedDose] = useState('')
  const [patientWeight, setPatientWeight] = useState('')
  const [weightResult, setWeightResult] = useState<number | null>(null)

  // Safe Dose Range
  const [orderedDose, setOrderedDose] = useState('')
  const [minDose, setMinDose] = useState('')
  const [maxDose, setMaxDose] = useState('')
  const [safeDoseWeight, setSafeDoseWeight] = useState('')
  const [safeDoseResult, setSafeDoseResult] = useState<{ isSafe: boolean; reason: string } | null>(null)

  // Calculate IV Flow Rate
  useEffect(() => {
    const vol = parseFloat(totalVolume)
    const time = parseFloat(totalTime)
    if (vol > 0 && time > 0) {
      const result = vol / time
      setIvFlowResult(result)
    } else {
      setIvFlowResult(null)
    }
  }, [totalVolume, totalTime])

  // Calculate Drops per Minute
  useEffect(() => {
    const vol = parseFloat(dropsVolume)
    const time = parseFloat(dropsTime)
    const factor = parseFloat(dropFactor)
    if (vol > 0 && time > 0 && factor > 0) {
      const result = (vol * factor) / (time * 60)
      setDropsResult(Math.round(result * 100) / 100)
    } else {
      setDropsResult(null)
    }
  }, [dropsVolume, dropsTime, dropFactor])

  // Calculate Weight-Based Dose
  useEffect(() => {
    const dose = parseFloat(medDose)
    const weight = parseFloat(patientWeight)
    if (dose > 0 && weight > 0) {
      const result = (dose / weight)
      setWeightResult(Math.round(result * 100) / 100)
    } else {
      setWeightResult(null)
    }
  }, [medDose, patientWeight])

  // Check Safe Dose Range
  useEffect(() => {
    const ordered = parseFloat(orderedDose)
    const min = parseFloat(minDose)
    const max = parseFloat(maxDose)
    const weight = parseFloat(safeDoseWeight)
    
    if (ordered > 0 && min > 0 && max > 0 && weight > 0) {
      const minTotal = min * weight
      const maxTotal = max * weight
      const isSafe = ordered >= minTotal && ordered <= maxTotal
      
      if (isSafe) {
        setSafeDoseResult({
          isSafe: true,
          reason: `Ordered dose (${ordered} mg) is within safe range (${minTotal.toFixed(2)} - ${maxTotal.toFixed(2)} mg)`
        })
      } else {
        if (ordered < minTotal) {
          setSafeDoseResult({
            isSafe: false,
            reason: `Ordered dose (${ordered} mg) is below minimum safe dose (${minTotal.toFixed(2)} mg)`
          })
        } else {
          setSafeDoseResult({
            isSafe: false,
            reason: `Ordered dose (${ordered} mg) exceeds maximum safe dose (${maxTotal.toFixed(2)} mg)`
          })
        }
      }
    } else {
      setSafeDoseResult(null)
    }
  }, [orderedDose, minDose, maxDose, safeDoseWeight])

  const tools: { id: CalculatorTool; label: string }[] = [
    { id: 'iv-flow', label: 'IV Flow Rate' },
    { id: 'drops-per-minute', label: 'Drops/min' },
    { id: 'weight-based', label: 'Weight-Based' },
    { id: 'safe-dose', label: 'Safe Dose Range' }
  ]

  if (!isOpen) return null

  return (
    <>
      {/* Overlay - Both mobile and desktop */}
      <div 
        className="fixed inset-0 bg-black/20 z-[60] transition-opacity md:bg-black/10"
        onClick={onClose}
      />
      
      {/* Calculator Panel */}
      <div className={`
        bg-white rounded-xl shadow-xl border border-slate-200
        ${/* Desktop */ 'hidden md:block fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md z-[60] max-h-[60vh] overflow-y-auto'}
        ${/* Mobile */ 'md:hidden fixed bottom-0 left-0 right-0 z-[60] rounded-t-xl max-h-[70vh] overflow-y-auto'}
      `}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-600" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Medical Math — Study Tool</h3>
              <p className="text-xs text-slate-600">For educational practice only</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
            aria-label="Close calculator"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Tool Tabs */}
        <div className="flex gap-1 px-2 pt-3 border-b border-slate-200 overflow-x-auto">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`
                px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors
                ${activeTool === tool.id
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              {tool.label}
            </button>
          ))}
        </div>

        {/* Calculator Content */}
        <div className="p-4">
          {/* IV Flow Rate */}
          {activeTool === 'iv-flow' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Total Volume (mL)
                </label>
                <Input
                  type="number"
                  value={totalVolume}
                  onChange={(e) => setTotalVolume(e.target.value)}
                  placeholder="e.g., 1000"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Total Time (hours)
                </label>
                <Input
                  type="number"
                  value={totalTime}
                  onChange={(e) => setTotalTime(e.target.value)}
                  placeholder="e.g., 8"
                  className="text-sm"
                />
              </div>
              
              {ivFlowResult !== null && (
                <div className="bg-indigo-50 rounded-lg p-3 space-y-2">
                  <div className="text-sm font-semibold text-indigo-900">
                    Flow Rate: {ivFlowResult.toFixed(2)} mL/hr
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-medium">Formula:</p>
                    <p className="font-mono">Flow Rate = Total Volume ÷ Total Time</p>
                    <p className="font-medium mt-2">Calculation:</p>
                    <p className="font-mono">{totalVolume} ÷ {totalTime} = {ivFlowResult.toFixed(2)} mL/hr</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Drops per Minute */}
          {activeTool === 'drops-per-minute' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Volume (mL)
                </label>
                <Input
                  type="number"
                  value={dropsVolume}
                  onChange={(e) => setDropsVolume(e.target.value)}
                  placeholder="e.g., 1000"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Time (hours)
                </label>
                <Input
                  type="number"
                  value={dropsTime}
                  onChange={(e) => setDropsTime(e.target.value)}
                  placeholder="e.g., 8"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Drop Factor (gtt/mL)
                </label>
                <Input
                  type="number"
                  value={dropFactor}
                  onChange={(e) => setDropFactor(e.target.value)}
                  placeholder="15"
                  className="text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Common: 10, 15, 20, or 60 gtt/mL</p>
              </div>
              
              {dropsResult !== null && (
                <div className="bg-indigo-50 rounded-lg p-3 space-y-2">
                  <div className="text-sm font-semibold text-indigo-900">
                    Drops per Minute: {dropsResult} gtt/min
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-medium">Formula:</p>
                    <p className="font-mono">Drops/min = (Volume × Drop Factor) ÷ (Time × 60)</p>
                    <p className="font-medium mt-2">Calculation:</p>
                    <p className="font-mono">({dropsVolume} × {dropFactor}) ÷ ({dropsTime} × 60) = {dropsResult} gtt/min</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weight-Based Dose */}
          {activeTool === 'weight-based' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Medication Dose (mg)
                </label>
                <Input
                  type="number"
                  value={medDose}
                  onChange={(e) => setMedDose(e.target.value)}
                  placeholder="e.g., 500"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Patient Weight (kg)
                </label>
                <Input
                  type="number"
                  value={patientWeight}
                  onChange={(e) => setPatientWeight(e.target.value)}
                  placeholder="e.g., 70"
                  className="text-sm"
                />
              </div>
              
              {weightResult !== null && (
                <div className="bg-indigo-50 rounded-lg p-3 space-y-2">
                  <div className="text-sm font-semibold text-indigo-900">
                    Dose per kg: {weightResult} mg/kg
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-medium">Formula:</p>
                    <p className="font-mono">Dose/kg = Total Dose ÷ Patient Weight</p>
                    <p className="font-medium mt-2">Calculation:</p>
                    <p className="font-mono">{medDose} ÷ {patientWeight} = {weightResult} mg/kg</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Safe Dose Range */}
          {activeTool === 'safe-dose' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Ordered Dose (mg)
                </label>
                <Input
                  type="number"
                  value={orderedDose}
                  onChange={(e) => setOrderedDose(e.target.value)}
                  placeholder="e.g., 500"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Minimum Dose (mg/kg)
                </label>
                <Input
                  type="number"
                  value={minDose}
                  onChange={(e) => setMinDose(e.target.value)}
                  placeholder="e.g., 5"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Maximum Dose (mg/kg)
                </label>
                <Input
                  type="number"
                  value={maxDose}
                  onChange={(e) => setMaxDose(e.target.value)}
                  placeholder="e.g., 10"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Patient Weight (kg)
                </label>
                <Input
                  type="number"
                  value={safeDoseWeight}
                  onChange={(e) => setSafeDoseWeight(e.target.value)}
                  placeholder="e.g., 70"
                  className="text-sm"
                />
              </div>
              
              {safeDoseResult && (
                <div className={`rounded-lg p-3 space-y-2 ${safeDoseResult.isSafe ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <div className={`text-sm font-semibold ${safeDoseResult.isSafe ? 'text-emerald-900' : 'text-red-900'}`}>
                    {safeDoseResult.isSafe ? '✓ Safe Dose' : '⚠ Dose Outside Safe Range'}
                  </div>
                  <div className="text-xs text-slate-700">
                    {safeDoseResult.reason}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 mt-2">
                    <p className="font-medium">Formula:</p>
                    <p className="font-mono">Safe Range = (Min mg/kg × Weight) to (Max mg/kg × Weight)</p>
                    <p className="font-medium mt-2">Calculation:</p>
                    <p className="font-mono">
                      Range: ({minDose} × {safeDoseWeight}) to ({maxDose} × {safeDoseWeight}) mg
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-4 py-2 rounded-b-xl">
          <p className="text-[10px] text-slate-500 text-center">
            Not for clinical decision use. Always verify per institutional policy.
          </p>
        </div>
      </div>
    </>
  )
}


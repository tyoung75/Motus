import React, { useState } from 'react';
import { X, Info } from 'lucide-react';

export function AdvancedMetricsModal({ isOpen, onClose, formData, updateFormData }) {
  const [activeTab, setActiveTab] = useState('dexa');

  if (!isOpen) return null;

  const tabs = [
    { id: 'dexa', label: 'DEXA Scan', icon: '📊' },
    { id: 'inbody', label: 'InBody', icon: '⚡' },
    { id: 'rmr', label: 'RMR Test', icon: '🔥' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <div>
            <h2 className="text-xl font-bold text-white">Advanced Body Metrics</h2>
            <p className="text-sm text-gray-400">
              Enter data from professional body composition tests
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-600">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-accent-primary border-b-2 border-accent-primary bg-dark-700/50'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700/30'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {activeTab === 'dexa' && (
            <DEXAForm formData={formData} updateFormData={updateFormData} />
          )}
          {activeTab === 'inbody' && (
            <InBodyForm formData={formData} updateFormData={updateFormData} />
          )}
          {activeTab === 'rmr' && (
            <RMRForm formData={formData} updateFormData={updateFormData} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-600">
          <button
            onClick={onClose}
            className="w-full py-3 bg-accent-primary text-dark-900 font-semibold rounded-lg hover:bg-accent-primary/90"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DEXAForm({ formData, updateFormData }) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5" />
          <p className="text-sm text-blue-300">
            DEXA (Dual-Energy X-ray Absorptiometry) is the gold standard for body composition analysis, providing accurate measurements of bone density, fat mass, and lean mass.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Body Fat Percentage (%)
        </label>
        <input
          type="number"
          value={formData.dexaBodyFat || ''}
          onChange={(e) => updateFormData('dexaBodyFat', e.target.value)}
          placeholder="e.g., 18.5"
          step="0.1"
          min="3"
          max="60"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Lean Body Mass (lbs)
        </label>
        <input
          type="number"
          value={formData.dexaLeanMass || ''}
          onChange={(e) => updateFormData('dexaLeanMass', e.target.value)}
          placeholder="e.g., 145"
          step="0.1"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Fat Mass (lbs)
        </label>
        <input
          type="number"
          value={formData.dexaFatMass || ''}
          onChange={(e) => updateFormData('dexaFatMass', e.target.value)}
          placeholder="e.g., 35"
          step="0.1"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Bone Mineral Density (g/cm²) <span className="text-gray-500">(Optional)</span>
        </label>
        <input
          type="number"
          value={formData.dexaBMD || ''}
          onChange={(e) => updateFormData('dexaBMD', e.target.value)}
          placeholder="e.g., 1.2"
          step="0.01"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Scan Date
        </label>
        <input
          type="date"
          value={formData.dexaScanDate || ''}
          onChange={(e) => updateFormData('dexaScanDate', e.target.value)}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
        />
      </div>
    </div>
  );
}

function InBodyForm({ formData, updateFormData }) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-purple-400 mt-0.5" />
          <p className="text-sm text-purple-300">
            InBody uses bioelectrical impedance analysis (BIA) to measure body composition. It provides data on muscle mass, body fat, and water distribution.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Body Fat Percentage (%)
        </label>
        <input
          type="number"
          value={formData.inbodyBodyFat || ''}
          onChange={(e) => updateFormData('inbodyBodyFat', e.target.value)}
          placeholder="e.g., 20.3"
          step="0.1"
          min="3"
          max="60"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Skeletal Muscle Mass (lbs)
        </label>
        <input
          type="number"
          value={formData.inbodySMM || ''}
          onChange={(e) => updateFormData('inbodySMM', e.target.value)}
          placeholder="e.g., 85"
          step="0.1"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Total Body Water (lbs)
        </label>
        <input
          type="number"
          value={formData.inbodyTBW || ''}
          onChange={(e) => updateFormData('inbodyTBW', e.target.value)}
          placeholder="e.g., 95"
          step="0.1"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Basal Metabolic Rate (kcal) <span className="text-gray-500">(from InBody)</span>
        </label>
        <input
          type="number"
          value={formData.inbodyBMR || ''}
          onChange={(e) => updateFormData('inbodyBMR', e.target.value)}
          placeholder="e.g., 1850"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          InBody Score <span className="text-gray-500">(Optional)</span>
        </label>
        <input
          type="number"
          value={formData.inbodyScore || ''}
          onChange={(e) => updateFormData('inbodyScore', e.target.value)}
          placeholder="e.g., 78"
          min="0"
          max="100"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Test Date
        </label>
        <input
          type="date"
          value={formData.inbodyDate || ''}
          onChange={(e) => updateFormData('inbodyDate', e.target.value)}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
        />
      </div>
    </div>
  );
}

function RMRForm({ formData, updateFormData }) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-orange-400 mt-0.5" />
          <p className="text-sm text-orange-300">
            Resting Metabolic Rate (RMR) testing measures the calories your body burns at rest using indirect calorimetry. This is the most accurate way to determine your true metabolic rate.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Measured RMR (kcal/day)
        </label>
        <input
          type="number"
          value={formData.measuredRMR || ''}
          onChange={(e) => updateFormData('measuredRMR', e.target.value)}
          placeholder="e.g., 1750"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          This will override our calculated BMR estimate for more accurate calorie targets.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Respiratory Quotient (RQ) <span className="text-gray-500">(Optional)</span>
        </label>
        <input
          type="number"
          value={formData.measuredRQ || ''}
          onChange={(e) => updateFormData('measuredRQ', e.target.value)}
          placeholder="e.g., 0.85"
          step="0.01"
          min="0.7"
          max="1.0"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          RQ indicates fuel utilization: 0.7 = mostly fat, 1.0 = mostly carbs
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Testing Facility/Method
        </label>
        <input
          type="text"
          value={formData.rmrFacility || ''}
          onChange={(e) => updateFormData('rmrFacility', e.target.value)}
          placeholder="e.g., DEXA Fit, BodySpec"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Test Date
        </label>
        <input
          type="date"
          value={formData.rmrDate || ''}
          onChange={(e) => updateFormData('rmrDate', e.target.value)}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white"
        />
      </div>

      {/* Comparison with estimated */}
      {formData.measuredRMR && (
        <div className="p-3 bg-dark-700 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Comparison:</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Measured RMR:</span>
            <span className="text-accent-primary font-bold">{formData.measuredRMR} kcal</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Your measured RMR will be used instead of calculated estimates for more accurate nutrition targets.
          </p>
        </div>
      )}
    </div>
  );
}

export default AdvancedMetricsModal;

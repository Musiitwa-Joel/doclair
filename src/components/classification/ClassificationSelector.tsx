import React, { useState } from 'react';
import { Shield, AlertTriangle, Info, Lock, Eye, Users } from 'lucide-react';
import { ClassificationMarking, STRAP_LEVELS, STRAPLevel } from '../../types/classification';

interface ClassificationSelectorProps {
  onClassificationChange: (classification: ClassificationMarking) => void;
  currentClassification?: ClassificationMarking;
}

const ClassificationSelector: React.FC<ClassificationSelectorProps> = ({
  onClassificationChange,
  currentClassification
}) => {
  const [baseClassification, setBaseClassification] = useState<ClassificationMarking['baseClassification']>(
    currentClassification?.baseClassification || 'UNCLASSIFIED'
  );
  const [selectedSTRAP, setSelectedSTRAP] = useState<number | null>(
    currentClassification?.strapLevel?.level || null
  );
  const [caveats, setCaveats] = useState<string[]>(currentClassification?.caveats || []);
  const [releasability, setReleasability] = useState<string[]>(currentClassification?.releasability || []);

  const baseClassifications = [
    'UNCLASSIFIED',
    'RESTRICTED', 
    'CONFIDENTIAL',
    'SECRET',
    'TOP SECRET'
  ];

  const commonCaveats = [
    'NOFORN',
    'ORCON',
    'PROPIN',
    'REL TO',
    'EYES ONLY',
    'SPECIAL HANDLING',
    'CONTROLLED DISSEMINATION'
  ];

  const handleClassificationUpdate = () => {
    const classification: ClassificationMarking = {
      baseClassification,
      strapLevel: selectedSTRAP ? STRAP_LEVELS[selectedSTRAP] : undefined,
      caveats,
      releasability,
      originatorReference: `DOC-${Date.now()}`,
      handlingInstructions: selectedSTRAP ? STRAP_LEVELS[selectedSTRAP].handlingInstructions : []
    };
    
    onClassificationChange(classification);
  };

  React.useEffect(() => {
    handleClassificationUpdate();
  }, [baseClassification, selectedSTRAP, caveats, releasability]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Shield className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-xl font-bold text-gray-900">Document Classification</h3>
      </div>

      {/* Base Classification */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Base Classification Level
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {baseClassifications.map((level) => (
            <button
              key={level}
              onClick={() => setBaseClassification(level as any)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                baseClassification === level
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* STRAP Level Selection */}
      {(baseClassification === 'SECRET' || baseClassification === 'TOP SECRET') && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            STRAP Level (Special Access)
          </label>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedSTRAP(null)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                selectedSTRAP === null
                  ? 'border-gray-400 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">No STRAP Classification</div>
              <div className="text-sm text-gray-600">Standard classification only</div>
            </button>
            
            {Object.values(STRAP_LEVELS).map((strap) => (
              <button
                key={strap.level}
                onClick={() => setSelectedSTRAP(strap.level)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  selectedSTRAP === strap.level
                    ? `${strap.borderColor} ${strap.backgroundColor}`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`font-bold ${selectedSTRAP === strap.level ? strap.textColor : 'text-gray-900'}`}>
                    {strap.name}
                  </div>
                  <Lock className={`h-4 w-4 ${selectedSTRAP === strap.level ? strap.textColor : 'text-gray-400'}`} />
                </div>
                <div className={`text-sm mb-2 ${selectedSTRAP === strap.level ? strap.textColor : 'text-gray-600'}`}>
                  {strap.description}
                </div>
                <div className={`text-xs ${selectedSTRAP === strap.level ? strap.textColor : 'text-gray-500'}`}>
                  Requires: {strap.clearanceRequired}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Caveats */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Handling Caveats
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {commonCaveats.map((caveat) => (
            <button
              key={caveat}
              onClick={() => {
                if (caveats.includes(caveat)) {
                  setCaveats(caveats.filter(c => c !== caveat));
                } else {
                  setCaveats([...caveats, caveat]);
                }
              }}
              className={`p-2 rounded-md text-xs font-medium transition-all duration-200 ${
                caveats.includes(caveat)
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {caveat}
            </button>
          ))}
        </div>
      </div>

      {/* Current Classification Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-700 mb-2">Classification Preview:</div>
        <div className={`
          p-3 rounded-md text-center font-bold text-sm uppercase tracking-wider
          ${selectedSTRAP ? STRAP_LEVELS[selectedSTRAP].backgroundColor : 'bg-gray-200'}
          ${selectedSTRAP ? STRAP_LEVELS[selectedSTRAP].textColor : 'text-gray-800'}
          ${selectedSTRAP ? STRAP_LEVELS[selectedSTRAP].borderColor : 'border-gray-400'}
          border-2
        `}>
          {baseClassification}
          {selectedSTRAP && ` - UK EYES ONLY - STRAP ${selectedSTRAP}`}
          {caveats.length > 0 && ` - ${caveats.join(' - ')}`}
        </div>
      </div>

      {/* Security Warning */}
      {selectedSTRAP && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <div className="font-semibold text-red-800 mb-1">Security Notice</div>
              <div className="text-sm text-red-700">
                STRAP {selectedSTRAP} classification requires special handling procedures. 
                Unauthorized disclosure may result in serious legal consequences under the Official Secrets Act.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassificationSelector;
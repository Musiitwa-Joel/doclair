import React from 'react';
import { Shield, AlertTriangle, Lock, Eye } from 'lucide-react';
import { ClassificationMarking, STRAP_LEVELS } from '../../types/classification';

interface STRAPBannerProps {
  classification: ClassificationMarking;
  position?: 'top' | 'bottom' | 'both';
  size?: 'sm' | 'md' | 'lg';
}

const STRAPBanner: React.FC<STRAPBannerProps> = ({ 
  classification, 
  position = 'both',
  size = 'md' 
}) => {
  const strapLevel = classification.strapLevel;
  
  const sizeClasses = {
    sm: 'py-1 px-3 text-xs',
    md: 'py-2 px-4 text-sm',
    lg: 'py-3 px-6 text-base'
  };

  const renderBanner = () => (
    <div className={`
      ${strapLevel ? strapLevel.backgroundColor : 'bg-gray-100'} 
      ${strapLevel ? strapLevel.textColor : 'text-gray-800'}
      ${strapLevel ? strapLevel.borderColor : 'border-gray-300'}
      border-2 ${sizeClasses[size]} font-bold text-center uppercase tracking-wider
      flex items-center justify-center gap-2 shadow-sm
    `}>
      <Shield className="h-4 w-4" />
      <span>
        {classification.baseClassification}
        {strapLevel && ` - UK EYES ONLY - ${strapLevel.name}`}
        {classification.caveats.length > 0 && ` - ${classification.caveats.join(' - ')}`}
      </span>
      {strapLevel && <Lock className="h-4 w-4" />}
    </div>
  );

  return (
    <>
      {(position === 'top' || position === 'both') && renderBanner()}
      {(position === 'bottom' || position === 'both') && position === 'both' && (
        <div className="flex-1" />
      )}
      {(position === 'bottom' || position === 'both') && renderBanner()}
    </>
  );
};

export default STRAPBanner;
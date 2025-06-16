import React, { useState } from 'react';
import { User, Shield, Eye, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { STRAPLevel, AccessLogEntry } from '../../types/classification';

interface AccessControlProps {
  strapLevel?: STRAPLevel;
  onAccessGranted: () => void;
  onAccessDenied: () => void;
}

interface UserCredentials {
  userId: string;
  clearanceLevel: 'SC' | 'DV' | 'STRAP1' | 'STRAP2' | 'STRAP3';
  specialAccess: string[];
  lastVetting: Date;
}

const AccessControl: React.FC<AccessControlProps> = ({
  strapLevel,
  onAccessGranted,
  onAccessDenied
}) => {
  const [credentials, setCredentials] = useState<Partial<UserCredentials>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [accessAttempts, setAccessAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const clearanceLevels = [
    { value: 'SC', label: 'Security Cleared (SC)', level: 1 },
    { value: 'DV', label: 'Developed Vetting (DV)', level: 2 },
    { value: 'STRAP1', label: 'STRAP 1 Cleared', level: 3 },
    { value: 'STRAP2', label: 'STRAP 2 Cleared', level: 4 },
    { value: 'STRAP3', label: 'STRAP 3 Cleared', level: 5 }
  ];

  const getRequiredClearanceLevel = (): number => {
    if (!strapLevel) return 1;
    switch (strapLevel.level) {
      case 1: return 3;
      case 2: return 4;
      case 3: return 5;
      default: return 1;
    }
  };

  const verifyAccess = async () => {
    if (isLocked) {
      alert('Access locked due to multiple failed attempts. Contact security administrator.');
      return;
    }

    setIsVerifying(true);
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const userClearanceLevel = clearanceLevels.find(c => c.value === credentials.clearanceLevel)?.level || 0;
    const requiredLevel = getRequiredClearanceLevel();
    
    if (userClearanceLevel >= requiredLevel && credentials.userId) {
      // Log successful access
      const accessLog: AccessLogEntry = {
        userId: credentials.userId,
        timestamp: new Date(),
        action: 'VIEW',
        ipAddress: '192.168.1.100', // In real app, get actual IP
        userAgent: navigator.userAgent,
        clearanceLevel: credentials.clearanceLevel || 'UNKNOWN'
      };
      
      setIsVerifying(false);
      onAccessGranted();
    } else {
      setAccessAttempts(prev => prev + 1);
      if (accessAttempts >= 2) {
        setIsLocked(true);
      }
      setIsVerifying(false);
      onAccessDenied();
    }
  };

  if (isLocked) {
    return (
      <div className="bg-red-50 border-2 border-red-500 rounded-xl p-8 text-center">
        <X className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-800 mb-2">Access Locked</h3>
        <p className="text-red-700 mb-4">
          Multiple failed access attempts detected. This incident has been logged.
        </p>
        <p className="text-sm text-red-600">
          Contact your security administrator to regain access.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-blue-500 p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900">Security Clearance Required</h3>
        {strapLevel && (
          <div className={`mt-2 p-2 rounded-md ${strapLevel.backgroundColor} ${strapLevel.textColor} text-sm font-semibold`}>
            {strapLevel.name} Access Required
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            User ID
          </label>
          <input
            type="text"
            value={credentials.userId || ''}
            onChange={(e) => setCredentials({...credentials, userId: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your user ID"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Security Clearance Level
          </label>
          <select
            value={credentials.clearanceLevel || ''}
            onChange={(e) => setCredentials({...credentials, clearanceLevel: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select clearance level</option>
            {clearanceLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {strapLevel && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <div className="font-semibold mb-1">Access Requirements:</div>
                <ul className="list-disc list-inside space-y-1">
                  {strapLevel.accessRequirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={verifyAccess}
          disabled={isVerifying || !credentials.userId || !credentials.clearanceLevel}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Verifying Access...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Request Access
            </>
          )}
        </button>

        {accessAttempts > 0 && (
          <div className="text-center text-sm text-red-600">
            Failed attempts: {accessAttempts}/3
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        All access attempts are logged and monitored for security purposes.
      </div>
    </div>
  );
};

export default AccessControl;
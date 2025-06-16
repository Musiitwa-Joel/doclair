import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, FileText, Eye, Lock, AlertTriangle, Users, Clock, Database } from 'lucide-react';
import ClassificationSelector from '../components/classification/ClassificationSelector';
import STRAPBanner from '../components/classification/STRAPBanner';
import AccessControl from '../components/classification/AccessControl';
import { ClassificationMarking, ClassifiedDocument } from '../types/classification';

const ClassifiedTools: React.FC = () => {
  const [currentClassification, setCurrentClassification] = useState<ClassificationMarking | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [documents, setDocuments] = useState<ClassifiedDocument[]>([]);

  const classifiedTools = [
    {
      name: 'Classified PDF Redactor',
      description: 'Automatically redact sensitive information based on classification level',
      icon: FileText,
      strapRequired: false,
      features: ['Pattern-based redaction', 'STRAP-aware processing', 'Audit trail generation']
    },
    {
      name: 'STRAP Document Converter',
      description: 'Convert documents while maintaining classification markings',
      icon: FileText,
      strapRequired: true,
      features: ['Classification preservation', 'Metadata handling', 'Access control integration']
    },
    {
      name: 'Secure Document Viewer',
      description: 'View classified documents with proper security controls',
      icon: Eye,
      strapRequired: true,
      features: ['Watermarking', 'Screenshot prevention', 'Access logging']
    },
    {
      name: 'Classification Manager',
      description: 'Manage document classifications and access permissions',
      icon: Shield,
      strapRequired: false,
      features: ['Bulk classification', 'Permission management', 'Compliance reporting']
    }
  ];

  const handleAccessGranted = () => {
    setHasAccess(true);
  };

  const handleAccessDenied = () => {
    alert('Access denied. Insufficient clearance level or invalid credentials.');
  };

  if (currentClassification?.strapLevel && !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <AccessControl
          strapLevel={currentClassification.strapLevel}
          onAccessGranted={handleAccessGranted}
          onAccessDenied={handleAccessDenied}
        />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Classified Document Tools - STRAP Security | Doclair</title>
        <meta name="description" content="Professional classified document processing tools with STRAP security levels. Handle sensitive documents with proper security controls." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Security Banner */}
        {currentClassification && (
          <STRAPBanner classification={currentClassification} position="top" />
        )}

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-red-50 rounded-2xl mb-6">
                <Shield className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Classified Document Tools
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Professional tools for handling classified documents with STRAP security levels. 
                Maintain proper security controls and audit trails.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Classification Selector */}
            <div className="lg:col-span-1">
              <ClassificationSelector
                onClassificationChange={setCurrentClassification}
                currentClassification={currentClassification || undefined}
              />
            </div>

            {/* Tools Grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classifiedTools.map((tool, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-xl shadow-sm border p-6 transition-all duration-300 ${
                      tool.strapRequired && !currentClassification?.strapLevel
                        ? 'border-gray-200 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:shadow-lg hover:border-blue-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex p-3 rounded-lg ${
                        tool.strapRequired ? 'bg-red-50' : 'bg-blue-50'
                      }`}>
                        <tool.icon className={`h-6 w-6 ${
                          tool.strapRequired ? 'text-red-600' : 'text-blue-600'
                        }`} />
                      </div>
                      {tool.strapRequired && (
                        <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                          STRAP REQUIRED
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {tool.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4">
                      {tool.description}
                    </p>
                    
                    <div className="space-y-2">
                      {tool.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Security Information */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">
                      Security Notice
                    </h4>
                    <div className="text-blue-800 text-sm space-y-2">
                      <p>
                        These tools are designed for handling classified information in accordance with 
                        UK Government security protocols and the Official Secrets Act.
                      </p>
                      <p>
                        All document processing activities are logged and monitored. Unauthorized 
                        access or misuse may result in serious legal consequences.
                      </p>
                      <p>
                        Ensure you have appropriate security clearance before accessing STRAP-classified materials.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Footer Banner */}
        {currentClassification && (
          <STRAPBanner classification={currentClassification} position="bottom" />
        )}
      </div>
    </>
  );
};

export default ClassifiedTools;
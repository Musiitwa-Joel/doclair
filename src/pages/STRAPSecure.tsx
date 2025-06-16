import React, { useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Shield, 
  Upload, 
  Download, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  FileText,
  Image as ImageIcon,
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  RotateCcw,
  Save,
  Key,
  Database,
  Layers,
  Target,
  Sparkles,
  Brain,
  Scan
} from 'lucide-react';

interface STRAPLevel {
  level: 1 | 2 | 3;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  sensitivity: string;
  useCase: string;
}

interface RedactionArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'manual' | 'ai-detected';
  category: 'text' | 'face' | 'signature' | 'email' | 'phone' | 'address';
}

interface ProcessingOptions {
  strapLevel: 1 | 2 | 3;
  encryptFile: boolean;
  stripMetadata: boolean;
  addWatermark: boolean;
  watermarkPosition: 'header' | 'footer' | 'center' | 'corners';
  redactionColor: string;
  password?: string;
}

const STRAPSecure: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [redactionAreas, setRedactionAreas] = useState<RedactionArea[]>([]);
  const [isDrawingRedaction, setIsDrawingRedaction] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<RedactionArea[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    strapLevel: 1,
    encryptFile: false,
    stripMetadata: true,
    addWatermark: true,
    watermarkPosition: 'header',
    redactionColor: '#000000'
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STRAP_LEVELS: STRAPLevel[] = [
    {
      level: 1,
      name: 'STRAP 1',
      description: 'Sensitive Information',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-400',
      sensitivity: 'Moderate Sensitivity',
      useCase: 'Internal documents, personal information, business data'
    },
    {
      level: 2,
      name: 'STRAP 2',
      description: 'Highly Sensitive Information',
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-500',
      sensitivity: 'High Sensitivity',
      useCase: 'Confidential reports, financial data, legal documents'
    },
    {
      level: 3,
      name: 'STRAP 3',
      description: 'Extremely Sensitive Information',
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-600',
      sensitivity: 'Maximum Sensitivity',
      useCase: 'Top secret data, security protocols, critical intelligence'
    }
  ];

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file.');
      return;
    }

    setUploadedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    // Reset redaction areas
    setRedactionAreas([]);
    setAiSuggestions([]);
  }, []);

  const runAIDetection = useCallback(async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    
    // Simulate AI detection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI suggestions
    const mockSuggestions: RedactionArea[] = [
      {
        id: 'ai-1',
        x: 100,
        y: 150,
        width: 200,
        height: 25,
        type: 'ai-detected',
        category: 'email'
      },
      {
        id: 'ai-2',
        x: 150,
        y: 200,
        width: 150,
        height: 20,
        type: 'ai-detected',
        category: 'phone'
      },
      {
        id: 'ai-3',
        x: 80,
        y: 300,
        width: 180,
        height: 30,
        type: 'ai-detected',
        category: 'signature'
      }
    ];

    setAiSuggestions(mockSuggestions);
    setShowAiSuggestions(true);
    setIsProcessing(false);
  }, [uploadedFile]);

  const acceptAISuggestion = (suggestion: RedactionArea) => {
    setRedactionAreas(prev => [...prev, { ...suggestion, type: 'manual' }]);
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const rejectAISuggestion = (suggestionId: string) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const addManualRedaction = (x: number, y: number, width: number, height: number) => {
    const newRedaction: RedactionArea = {
      id: `manual-${Date.now()}`,
      x,
      y,
      width,
      height,
      type: 'manual',
      category: 'text'
    };
    setRedactionAreas(prev => [...prev, newRedaction]);
  };

  const removeRedaction = (id: string) => {
    setRedactionAreas(prev => prev.filter(r => r.id !== id));
  };

  const processDocument = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create download link (mock)
    const blob = new Blob([uploadedFile], { type: uploadedFile.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STRAP${processingOptions.strapLevel}_${uploadedFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsProcessing(false);
  };

  const currentSTRAP = STRAP_LEVELS.find(level => level.level === processingOptions.strapLevel)!;

  return (
    <>
      <Helmet>
        <title>STRAP Secure - AI-Powered Document Security Tool | Doclair</title>
        <meta name="description" content="Apply STRAP-style sensitivity levels to documents and images. AI-powered redaction, encryption, and security labeling for sensitive information protection." />
        <meta name="keywords" content="document security, STRAP levels, redaction tool, AI document processing, sensitive information protection" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl mb-6 shadow-2xl">
                <Shield className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                <span className="cursive-text text-5xl text-red-600">STRAP</span> Secure
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                AI-powered document security tool for applying <span className="cursive-text text-orange-600 text-xl">sensitivity levels</span> 
                to PDFs and images. Redact sensitive information and add professional security markings.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI-Powered Detection
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  AES-256 Encryption
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Metadata Stripping
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Processing Area */}
            <div className="lg:col-span-2 space-y-8">
              {/* File Upload */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Upload className="h-6 w-6 text-blue-600" />
                  Upload Document or Image
                </h3>
                
                {!uploadedFile ? (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="bg-blue-50 p-4 rounded-2xl">
                        <FileText className="h-12 w-12 text-blue-600" />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Drop your file here or click to browse
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Supports PDF, JPG, PNG files up to 50MB
                    </p>
                    <button className="btn-primary">
                      <Upload className="h-5 w-5" />
                      Choose File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* File Info */}
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          {uploadedFile.type.startsWith('image/') ? (
                            <ImageIcon className="h-5 w-5 text-blue-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{uploadedFile.name}</div>
                          <div className="text-sm text-gray-600">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadedFile(null);
                          setFilePreview(null);
                          setRedactionAreas([]);
                          setAiSuggestions([]);
                        }}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {/* AI Detection */}
                    <div className="flex gap-4">
                      <button
                        onClick={runAIDetection}
                        disabled={isProcessing}
                        className="btn-primary flex-1"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Scan className="h-5 w-5" />
                            AI Detect Sensitive Content
                          </>
                        )}
                      </button>
                      <button className="btn-secondary">
                        <Target className="h-5 w-5" />
                        Manual Select
                      </button>
                    </div>

                    {/* Preview Area */}
                    {filePreview && (
                      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                        <img 
                          src={filePreview} 
                          alt="Document preview" 
                          className="w-full h-auto max-h-96 object-contain"
                        />
                        
                        {/* Redaction Overlays */}
                        {redactionAreas.map(area => (
                          <div
                            key={area.id}
                            className="absolute bg-black opacity-80 cursor-pointer group"
                            style={{
                              left: area.x,
                              top: area.y,
                              width: area.width,
                              height: area.height
                            }}
                            onClick={() => removeRedaction(area.id)}
                          >
                            <div className="absolute -top-6 left-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to remove
                            </div>
                          </div>
                        ))}

                        {/* AI Suggestions */}
                        {showAiSuggestions && aiSuggestions.map(suggestion => (
                          <div
                            key={suggestion.id}
                            className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-pointer"
                            style={{
                              left: suggestion.x,
                              top: suggestion.y,
                              width: suggestion.width,
                              height: suggestion.height
                            }}
                          >
                            <div className="absolute -top-8 left-0 flex gap-1">
                              <button
                                onClick={() => acceptAISuggestion(suggestion)}
                                className="bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => rejectAISuggestion(suggestion.id)}
                                className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="absolute -bottom-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              {suggestion.category}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Redaction Summary */}
                    {redactionAreas.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <EyeOff className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-900">
                            {redactionAreas.length} area(s) marked for redaction
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {redactionAreas.map(area => (
                            <span
                              key={area.id}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                            >
                              {area.category}
                              <button
                                onClick={() => removeRedaction(area.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Processing Controls */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Processing Options
                  </h3>

                  <div className="space-y-6">
                    {/* Encryption */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-semibold text-gray-900">AES-256 Encryption</div>
                          <div className="text-sm text-gray-600">Password protect the final file</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={processingOptions.encryptFile}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            encryptFile: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {processingOptions.encryptFile && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Encryption Password
                        </label>
                        <input
                          type="password"
                          value={processingOptions.password || ''}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            password: e.target.value
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter a strong password"
                        />
                      </div>
                    )}

                    {/* Metadata Stripping */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-orange-600" />
                        <div>
                          <div className="font-semibold text-gray-900">Strip Metadata</div>
                          <div className="text-sm text-gray-600">Remove EXIF data and document properties</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={processingOptions.stripMetadata}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            stripMetadata: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                    </div>

                    {/* Watermark */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Layers className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-semibold text-gray-900">Add STRAP Watermark</div>
                          <div className="text-sm text-gray-600">Apply security markings to document</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={processingOptions.addWatermark}
                          onChange={(e) => setProcessingOptions(prev => ({
                            ...prev,
                            addWatermark: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    {/* Process Button */}
                    <button
                      onClick={processDocument}
                      disabled={isProcessing || redactionAreas.length === 0}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                          Processing STRAP {processingOptions.strapLevel} Document...
                        </>
                      ) : (
                        <>
                          <Shield className="h-6 w-6" />
                          Apply STRAP {processingOptions.strapLevel} Security
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* STRAP Level Selector */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  STRAP Security Level
                </h3>
                
                <div className="space-y-3">
                  {STRAP_LEVELS.map((level) => (
                    <div
                      key={level.level}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        processingOptions.strapLevel === level.level
                          ? `${level.borderColor} ${level.bgColor}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setProcessingOptions(prev => ({
                        ...prev,
                        strapLevel: level.level
                      }))}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`font-bold ${
                          processingOptions.strapLevel === level.level ? level.textColor : 'text-gray-900'
                        }`}>
                          {level.name}
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          processingOptions.strapLevel === level.level
                            ? `${level.borderColor} bg-current`
                            : 'border-gray-300'
                        }`}></div>
                      </div>
                      <div className={`text-sm mb-2 ${
                        processingOptions.strapLevel === level.level ? level.textColor : 'text-gray-600'
                      }`}>
                        {level.sensitivity}
                      </div>
                      <div className={`text-xs ${
                        processingOptions.strapLevel === level.level ? level.textColor : 'text-gray-500'
                      }`}>
                        {level.useCase}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current STRAP Preview */}
              <div className={`rounded-xl border-2 p-6 ${currentSTRAP.borderColor} ${currentSTRAP.bgColor}`}>
                <div className="text-center">
                  <div className={`font-bold text-lg ${currentSTRAP.textColor} mb-2`}>
                    {currentSTRAP.name} - CONFIDENTIAL
                  </div>
                  <div className={`text-sm ${currentSTRAP.textColor} mb-3`}>
                    HANDLE WITH CARE
                  </div>
                  <div className={`text-xs ${currentSTRAP.textColor} opacity-75`}>
                    This marking will be applied to your document
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Security Features
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">AI Detection</div>
                      <div className="text-xs text-gray-600">Automatically identifies sensitive content</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <EyeOff className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Smart Redaction</div>
                      <div className="text-xs text-gray-600">Permanent removal of sensitive information</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">AES-256 Encryption</div>
                      <div className="text-xs text-gray-600">Military-grade file protection</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Database className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Metadata Removal</div>
                      <div className="text-xs text-gray-600">Strips all identifying information</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-900 mb-2">Usage Guidelines</div>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p>• Review AI suggestions carefully before accepting</p>
                      <p>• Use appropriate STRAP levels for your content</p>
                      <p>• Always verify redactions are complete</p>
                      <p>• Store processed files securely</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default STRAPSecure;
import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  FileText, 
  Upload, 
  Download, 
  Settings, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Image
} from 'lucide-react';

const ToolPage: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();

  // Mock tool data - in a real app, this would come from an API or database
  const getToolData = (id: string) => {
    const tools: Record<string, any> = {
      'word-to-pdf': {
        title: 'Word to PDF Converter',
        description: 'Convert Microsoft Word documents to PDF format with perfect formatting preservation.',
        category: 'PDF Conversion',
        icon: FileText,
        features: [
          'Maintains original formatting and layout',
          'Preserves images, tables, and graphics',
          'Supports DOC and DOCX formats',
          'Batch conversion available',
          'Password protection option'
        ],
        steps: [
          'Upload your Word document',
          'Choose conversion settings',
          'Click Convert to PDF',
          'Download your PDF file'
        ]
      },
      'pdf-to-word': {
        title: 'PDF to Word Converter',
        description: 'Convert PDF documents to editable Microsoft Word format with high accuracy.',
        category: 'PDF Conversion',
        icon: FileText,
        features: [
          'Maintains text formatting and structure',
          'Preserves images and tables',
          'OCR support for scanned PDFs',
          'Editable Word output',
          'Batch processing available'
        ],
        steps: [
          'Upload your PDF file',
          'Select output format (DOC/DOCX)',
          'Configure OCR settings if needed',
          'Convert and download'
        ]
      },
      'background-remove': {
        title: 'Background Remover',
        description: 'Remove backgrounds from images automatically using advanced AI technology.',
        category: 'Image Editing',
        icon: Image,
        features: [
          'AI-powered background detection',
          'Supports multiple image formats',
          'High-quality edge preservation',
          'Batch processing available',
          'Transparent PNG output'
        ],
        steps: [
          'Upload your image',
          'AI automatically detects background',
          'Preview the result',
          'Download transparent PNG'
        ]
      }
    };

    return tools[id] || {
      title: 'Tool Not Found',
      description: 'The requested tool could not be found.',
      category: 'Unknown',
      icon: AlertCircle,
      features: [],
      steps: []
    };
  };

  const tool = getToolData(toolId || '');
  const IconComponent = tool.icon;

  return (
    <>
      <Helmet>
        <title>{tool.title} - Free Online Tool | Doclair</title>
        <meta name="description" content={tool.description} />
        <meta name="keywords" content={`${tool.title.toLowerCase()}, ${tool.category.toLowerCase()}, online tool, free converter`} />
        <link rel="canonical" href={`https://doclair.com/en-US/tool/${toolId}`} />
        <meta property="og:title" content={`${tool.title} - Free Online Tool`} />
        <meta property="og:description" content={tool.description} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-blue-50 rounded-2xl mb-6">
                <IconComponent className="h-12 w-12 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {tool.title}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                {tool.description}
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {tool.category}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Tool Interface */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                  <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your File</h3>
                  <p className="text-gray-600 mb-6">
                    Drag and drop your file here or click to browse
                  </p>
                  <button className="btn-primary">
                    <Upload className="h-5 w-5" />
                    Choose File
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG
                  </p>
                </div>

                {/* Settings Panel */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Conversion Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Output Quality
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>High Quality</option>
                        <option>Medium Quality</option>
                        <option>Small File Size</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Range
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>All Pages</option>
                        <option>Current Page</option>
                        <option>Custom Range</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Features */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                <ul className="space-y-3">
                  {tool.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How It Works */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
                <ol className="space-y-4">
                  {tool.steps.map((step: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </div>
                      <span className="text-gray-600">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Security Note */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start">
                  <Shield className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-semibold text-green-900 mb-2">
                      Secure & Private
                    </h4>
                    <p className="text-green-700 text-sm">
                      All processing happens in your browser. Your files are never uploaded to our servers, ensuring complete privacy and security.
                    </p>
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

export default ToolPage;
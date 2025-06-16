import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Github, Twitter, Mail, Heart, Sparkles } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <span className="text-xl font-black text-white">Doclair</span>
                <div className="text-xs text-slate-400 font-medium -mt-1">Professional Toolkit</div>
              </div>
            </div>
            <p className="text-slate-300 mb-4 max-w-md text-sm leading-relaxed">
              The ultimate open-source PDF and image toolkit. Convert, edit, optimize, and manage your documents and images with professional-grade tools, completely free.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300 p-2 rounded-lg hover:bg-slate-800">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300 p-2 rounded-lg hover:bg-slate-800">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300 p-2 rounded-lg hover:bg-slate-800">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* PDF Tools */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              PDF Tools
            </h3>
            <ul className="space-y-2">
              <li><Link to="/en-US/tool/word-to-pdf" className="text-slate-300 hover:text-white transition-colors duration-300 text-sm">Word to PDF</Link></li>
              <li><Link to="/en-US/tool/pdf-to-word" className="text-slate-300 hover:text-white transition-colors duration-300 text-sm">PDF to Word</Link></li>
              <li><Link to="/en-US/tool/pdf-merge" className="text-slate-300 hover:text-white transition-colors duration-300 text-sm">Merge PDF</Link></li>
              <li><Link to="/en-US/tool/pdf-split" className="text-slate-300 hover:text-white transition-colors duration-300 text-sm">Split PDF</Link></li>
              <li><Link to="/en-US/tool/pdf-compress" className="text-slate-300 hover:text-white transition-colors duration-300 text-sm">Compress PDF</Link></li>
            </ul>
          </div>

          {/* Image Tools */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Image Tools
            </h3>
            <ul className="space-y-2">
              <li><Link to="/en-US/tool/image-resize" className="text-slate-300 hover:text-white transition-colors duration-300 text-sm">Resize Image</Link></li>
              <li><Link to="/en-US/tool/image-crop" className="text-slate-300 hover:text-white transition-colors duration-300 text-sm">Crop Image</Link></li>
              <li><Link to="/en-US/tool/background-remove" className="text-slate-300 hover:text-white transition-colors duration-300 text-sm">Remove Background</Link></li>
              <li><Link to="/en-US/tool/image-converter" className="text-slate-300 hover:text-white transition-colors duration-300 text-sm">Convert Format</Link></li>
              <li><Link to="/en-US/tool/image-compress" className="text-slate-300 hover:text-white transition-colors duration-300 text-sm">Compress Image</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © 2024 Doclair. Made with <Heart className="h-4 w-4 text-red-500 inline mx-1" /> for the open source community.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-300">Privacy Policy</Link>
            <Link to="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-300">Terms of Service</Link>
            <Link to="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-300">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
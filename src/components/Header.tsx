import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/en-US" className="flex items-center group">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-xl group-hover:scale-105 transition-transform duration-200 shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="ml-2.5">
              <span className="text-lg font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Doclair
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link
              to="/en-US"
              className={`text-sm font-medium transition-all duration-200 ${
                location.pathname === '/en-US'
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Home
            </Link>
            <Link
              to="/en-US/pdf-tools"
              className={`text-sm font-medium transition-all duration-200 ${
                location.pathname.includes('/pdf-tools')
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              PDF Tools
            </Link>
            <Link
              to="/en-US/image-tools"
              className={`text-sm font-medium transition-all duration-200 ${
                location.pathname.includes('/image-tools')
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Image Tools
            </Link>
            <Link
              to="/en-US/strap-secure"
              className={`text-sm font-medium transition-all duration-200 ${
                location.pathname.includes('/strap-secure')
                  ? 'text-red-600'
                  : 'text-gray-700 hover:text-red-600'
              }`}
            >
              <span className="flex items-center gap-1">
                STRAP Secure
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </span>
            </Link>
          </nav>

          {/* Search and CTA */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center bg-gray-100/80 rounded-full px-3 py-1.5 min-w-[200px]">
              <Search className="h-4 w-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search tools..."
                className="bg-transparent border-none outline-none text-sm placeholder-gray-500 w-full"
              />
            </div>
            <button className="apple-button">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
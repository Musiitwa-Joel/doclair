import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, FileText, Image, Wrench, Shield, Zap, Palette, Scissors } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const categories = [
    {
      title: 'PDF Tools',
      icon: FileText,
      path: '/en-US/pdf-tools',
      items: [
        { name: 'Convert PDF', path: '/en-US/tool/pdf-converter' },
        { name: 'Merge PDF', path: '/en-US/tool/pdf-merge' },
        { name: 'Split PDF', path: '/en-US/tool/pdf-split' },
        { name: 'Compress PDF', path: '/en-US/tool/pdf-compress' },
        { name: 'Protect PDF', path: '/en-US/tool/pdf-protect' },
      ]
    },
    {
      title: 'Image Tools',
      icon: Image,
      path: '/en-US/image-tools',
      items: [
        { name: 'Resize Image', path: '/en-US/tool/image-resize' },
        { name: 'Crop Image', path: '/en-US/tool/image-crop' },
        { name: 'Remove Background', path: '/en-US/tool/background-remove' },
        { name: 'Image Converter', path: '/en-US/tool/image-converter' },
        { name: 'Compress Image', path: '/en-US/tool/image-compress' },
      ]
    }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-200`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Tools</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-6 space-y-6">
          {categories.map((category) => (
            <div key={category.title}>
              <Link
                to={category.path}
                className="flex items-center text-sm font-medium text-gray-900 mb-3 hover:text-blue-600 transition-colors"
              >
                <category.icon className="h-5 w-5 mr-3" />
                {category.title}
              </Link>
              <ul className="space-y-2 ml-8">
                {category.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`block text-sm transition-colors ${
                        location.pathname === item.path
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
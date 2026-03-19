import { Link, useLocation } from 'react-router-dom';
import {
  DocumentTextIcon,
  SparklesIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { name: '首页', path: '/', icon: HomeIcon },
  { name: '简历管理', path: '/resumes', icon: DocumentTextIcon },
  { name: '简历优化', path: '/optimize', icon: SparklesIcon },
];

function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                智能简历优化器
              </span>
            </div>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

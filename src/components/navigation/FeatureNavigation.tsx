import { Link, useLocation } from 'react-router-dom';

const featurePages = [
  {
    path: '/eclipse-predictor',
    title: 'Eclipse Predictor',
    icon: '🌑',
    description: 'Solar & lunar eclipse calculator'
  },
  {
    path: '/moon-phase-calculator', 
    title: 'Moon Phase Calculator',
    icon: '🌙',
    description: 'Lunar calendar & phase predictor'
  },
  {
    path: '/astrophotography-planner',
    title: 'Astrophotography Planner', 
    icon: '📷',
    description: 'Camera settings & sky planning'
  }
];

interface FeatureNavigationProps {
  className?: string;
}

export default function FeatureNavigation({ className = '' }: FeatureNavigationProps) {
  const location = useLocation();
  const currentPath = location.pathname.replace(/^\/(en|fr)/, '');
  
  return (
    <nav className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h2 className="text-lg font-semibold mb-4 text-gray-800">SpaceView Tools</h2>
      <div className="grid gap-3">
        {featurePages.map((page) => {
          const isActive = currentPath === page.path;
          return (
            <Link
              key={page.path}
              to={page.path}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-xl flex-shrink-0">{page.icon}</span>
              <div className="min-w-0">
                <div className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                  {page.title}
                </div>
                <div className="text-sm text-gray-500">
                  {page.description}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <Link
          to="/?start=true"
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Open Full Simulator
        </Link>
      </div>
    </nav>
  );
}
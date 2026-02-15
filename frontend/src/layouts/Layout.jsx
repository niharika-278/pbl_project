import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/checkout', label: 'Checkout' },
  { to: '/ingestion', label: 'Data Ingestion' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <header className="bg-white border-b border-surface-200 shadow-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-8">
<span className="text-2xl font-bold tracking-tight">
  <span className="text-purple-600">Intelli</span>
  <span className="text-slate-800">Retail</span>
</span>
              <nav className="hidden md:flex gap-1">
                {nav.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-250 ${
                        isActive ? 'bg-surface-100 text-surface-900' : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-surface-500 hidden sm:inline">
                {user?.name} <span className="text-surface-400">({user?.role})</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-surface-600 hover:text-surface-900 font-medium"
              >
                Log out
              </button>
              <button
                type="button"
                className="md:hidden p-2 rounded-md text-surface-600 hover:bg-surface-100"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav className="md:hidden py-2 border-t border-surface-100">
              {nav.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm ${isActive ? 'bg-surface-100 font-medium' : 'text-surface-600'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}

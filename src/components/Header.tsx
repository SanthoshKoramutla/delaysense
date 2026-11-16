import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Package, BarChart3, Bell, FileText, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { user, profile, signOut, loading } = useAuth();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/alerts', label: 'Alerts', icon: Bell },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-header">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-heading font-bold group">
            <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg group-hover:shadow-xl transition-all">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="gradient-text">
              DelaySense AI
            </span>
          </Link>

          {!isHome && (
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {!loading && (
              <>
                {user && profile ? (
                  <>
                    <span className="text-sm font-medium text-foreground">
                      {profile.full_name}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={signOut}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10">
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button size="sm" asChild className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                      <Link to="/signup">Sign Up</Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

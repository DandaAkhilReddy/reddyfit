import { Link } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Team Roster', path: '/squad' },
    { name: 'Matches', path: '/matches' },
    { name: 'Practice', path: '/practice' },
    { name: 'Equipment', path: '/equipment' },
  ];

  return (
    <nav className="bg-green-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold">Islanders CC</Link>
          
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} className="hover:text-green-200 transition font-medium">
                {link.name}
              </Link>
            ))}
            <Link to="/login" className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className="block py-2 hover:text-green-200">
                {link.name}
              </Link>
            ))}
            <Link to="/login" onClick={() => setIsOpen(false)} className="block py-2 hover:text-green-200">
              Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

import { Link } from 'react-router-dom';
import { Users, Calendar, Activity, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-amber-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-800 to-green-700 text-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Islanders Cricket Club
          </h1>
          <p className="text-xl md:text-2xl mb-2 text-green-100">
            Corpus Christi, Texas
          </p>
          <p className="text-lg text-green-200 mb-8">
            <a href="mailto:" className="underline hover:text-white"></a>
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link 
              to="/squad"
              className="bg-white text-green-800 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition"
            >
              View Team Roster
            </Link>
            <Link 
              to="/matches"
              className="bg-green-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-950 transition border-2 border-white"
            >
              Match Schedule
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-6xl mx-auto py-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/squad" className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition border-l-4 border-green-600">
            <Users className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Team Roster</h3>
            <p className="text-gray-600">View all players and their profiles</p>
          </Link>

          <Link to="/matches" className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition border-l-4 border-amber-600">
            <Calendar className="w-12 h-12 text-amber-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Matches</h3>
            <p className="text-gray-600">Schedule and match results</p>
          </Link>

          <Link to="/practice" className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition border-l-4 border-blue-600">
            <Activity className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Practice</h3>
            <p className="text-gray-600">Training schedule and attendance</p>
          </Link>

          <Link to="/equipment" className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition border-l-4 border-red-600">
            <Shield className="w-12 h-12 text-red-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Equipment</h3>
            <p className="text-gray-600">Track your gear and kit</p>
          </Link>
        </div>
      </section>

      {/* Player Login Info */}
      <section className="max-w-6xl mx-auto py-12 px-6">
        <div className="bg-green-800 text-white p-10 rounded-xl">
          <h2 className="text-3xl font-bold mb-4">Player Portal</h2>
          <p className="text-lg mb-6 text-green-100">
            Players can log in to update their profile, manage equipment, and track what gear they have received.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="bg-green-900 p-4 rounded-lg">
              <h4 className="font-bold mb-2">✓ Update Your Profile</h4>
              <p className="text-green-200">Keep your contact info and bio current</p>
            </div>
            <div className="bg-green-900 p-4 rounded-lg">
              <h4 className="font-bold mb-2">✓ Track Equipment</h4>
              <p className="text-green-200">Mark what you have: Practice T-shirt, Match T-shirt, etc.</p>
            </div>
          </div>
          <Link 
            to="/login"
            className="inline-block mt-6 bg-white text-green-800 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition"
          >
            Player Login
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function PlayerProfile() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-amber-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">Player Profile</h1>
          <p className="text-gray-600">Welcome to your profile page!</p>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">Your equipment status will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

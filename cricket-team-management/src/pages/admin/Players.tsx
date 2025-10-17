import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Users as UsersIcon, Filter } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import DataTable from '../../components/DataTable';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import type { Column } from '../../components/DataTable';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Player, PlayerRole } from '../../types';
import toast, { Toaster } from 'react-hot-toast';

export default function Players() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<(Player & { id: string })[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<(Player & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    filterPlayers();
  }, [players, searchTerm, roleFilter, statusFilter]);

  async function fetchPlayers() {
    try {
      setLoading(true);
      const playersSnapshot = await getDocs(collection(db, 'players'));
      const playersData = playersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Player,
      }));
      setPlayers(playersData);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  }

  function filterPlayers() {
    let filtered = [...players];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'All') {
      filtered = filtered.filter(player => player.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(player =>
        statusFilter === 'Active' ? player.isActive : !player.isActive
      );
    }

    setFilteredPlayers(filtered);
  }

  async function handleDelete(playerId: string, playerName: string) {
    if (!confirm(`Are you sure you want to delete ${playerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'players', playerId));
      toast.success(`${playerName} has been removed`);
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player');
    }
  }

  const roles: Array<PlayerRole | 'All'> = ['All', 'Batsman', 'Allrounder', 'Bowler', 'WK-Batsman'];

  // Define table columns
  const columns: Column<Player & { id: string }>[] = [
    {
      key: 'player',
      title: 'Player',
      render: (player) => (
        <div className="flex items-center gap-3">
          <Avatar src={player.photo} name={player.name} size="md" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{player.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{player.email}</p>
          </div>
        </div>
      ),
      width: 'w-72',
    },
    {
      key: 'role',
      title: 'Role',
      render: (player) => (
        <Badge variant="info" size="sm">
          {player.role}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'position',
      title: 'Position',
      render: (player) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{player.position}</span>
      ),
      sortable: true,
    },
    {
      key: 'stats',
      title: 'Performance',
      render: (player) => (
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">{player.stats.matchesPlayed}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">M</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">{player.stats.runs}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">R</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">{player.stats.wickets}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">W</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (player) => (
        <Badge variant={player.isActive ? 'success' : 'default'} size="sm">
          {player.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (player) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/players/edit/${player.id}`)}
            className="p-2 text-island-blue-600 dark:text-island-blue-400 hover:bg-island-blue-50 dark:hover:bg-island-blue-900/20 rounded-lg transition-colors"
            title="Edit player"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(player.id, player.name)}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete player"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-island-blue-200 border-t-island-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading players...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
              Player Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your team roster ({filteredPlayers.length} {filteredPlayers.length === 1 ? 'player' : 'players'})
            </p>
          </div>
          <Link to="/admin/players/add">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Player
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Search Players
              </label>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as PlayerRole | 'All')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Players Table */}
        <DataTable
          data={filteredPlayers}
          columns={columns}
          emptyState={
            <EmptyState
              icon={UsersIcon}
              title="No players found"
              description={
                searchTerm || roleFilter !== 'All' || statusFilter !== 'All'
                  ? 'Try adjusting your filters to see more results'
                  : 'Get started by adding your first player to the team'
              }
              action={
                !searchTerm && roleFilter === 'All' && statusFilter === 'All' ? (
                  <Link to="/admin/players/add">
                    <Button variant="primary">Add Your First Player</Button>
                  </Link>
                ) : undefined
              }
            />
          }
        />
      </div>
    </AdminLayout>
  );
}

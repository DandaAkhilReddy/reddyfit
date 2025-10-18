import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Upload, Save, X, User as UserIcon } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import Card from '../../components/Card';
import Button from '../../components/Button';
// import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { db, storage } from '../../lib/firebase';
import type { Player, PlayerRole, PlayerPosition, BattingHand } from '../../types';
import toast, { Toaster } from 'react-hot-toast';

interface PlayerFormData {
  name: string;
  role: PlayerRole;
  battingHand?: BattingHand;
  position: PlayerPosition;
  bio?: string;
  contactPhone?: string;
  contactEmail?: string;
  matchesPlayed: number;
  runs: number;
  wickets: number;
  catches: number;
  stumpings?: number;
  battingAverage: number;
  bowlingAverage?: number;
  strikeRate: number;
  economy?: number;
  availability: boolean;
  attendanceRate: number;
  isActive: boolean;
}

export default function PlayerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [existingPhoto, setExistingPhoto] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<PlayerFormData>({
    defaultValues: {
      matchesPlayed: 0,
      runs: 0,
      wickets: 0,
      catches: 0,
      battingAverage: 0,
      strikeRate: 0,
      attendanceRate: 100,
      availability: true,
      isActive: true,
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (isEditMode && id) {
      fetchPlayer(id);
    }
  }, [id, isEditMode]);

  async function fetchPlayer(playerId: string) {
    try {
      setLoading(true);
      const playerDoc = await getDoc(doc(db, 'players', playerId));

      if (playerDoc.exists()) {
        const playerData = playerDoc.data() as Player;

        // Reset form with player data
        reset({
          name: playerData.name,
          role: playerData.role,
          battingHand: playerData.battingHand,
          position: playerData.position,
          bio: playerData.bio,
          contactPhone: playerData.contact?.phone,
          contactEmail: playerData.contact?.email,
          matchesPlayed: playerData.stats.matchesPlayed,
          runs: playerData.stats.runs,
          wickets: playerData.stats.wickets,
          catches: playerData.stats.catches,
          stumpings: playerData.stats.stumpings,
          battingAverage: playerData.stats.battingAverage,
          bowlingAverage: playerData.stats.bowlingAverage,
          strikeRate: playerData.stats.strikeRate,
          economy: playerData.stats.economy,
          availability: playerData.availability,
          attendanceRate: playerData.attendanceRate,
          isActive: playerData.isActive,
        });

        if (playerData.photo) {
          setExistingPhoto(playerData.photo);
        }
      } else {
        toast.error('Player not found');
        navigate('/admin/players');
      }
    } catch (error) {
      console.error('Error fetching player:', error);
      toast.error('Failed to load player data');
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function onSubmit(data: PlayerFormData) {
    try {
      setLoading(true);

      let photoURL = existingPhoto;

      // Upload photo if new file selected
      if (photoFile) {
        const storageRef = ref(storage, `players/${Date.now()}_${photoFile.name}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
        toast.success('Photo uploaded successfully!');
      }

      const playerData: Omit<Player, 'id'> = {
        name: data.name,
        role: data.role,
        battingHand: data.battingHand,
        position: data.position,
        bio: data.bio,
        contact: {
          phone: data.contactPhone,
          email: data.contactEmail,
        },
        photo: photoURL,
        stats: {
          matchesPlayed: Number(data.matchesPlayed),
          runs: Number(data.runs),
          wickets: Number(data.wickets),
          catches: Number(data.catches),
          stumpings: data.stumpings ? Number(data.stumpings) : undefined,
          battingAverage: Number(data.battingAverage),
          bowlingAverage: data.bowlingAverage ? Number(data.bowlingAverage) : undefined,
          strikeRate: Number(data.strikeRate),
          economy: data.economy ? Number(data.economy) : undefined,
        },
        equipment: [],
        availability: data.availability,
        attendanceRate: Number(data.attendanceRate),
        joinedDate: new Date(),
        isActive: data.isActive,
      };

      if (isEditMode && id) {
        await setDoc(doc(db, 'players', id), playerData);
        toast.success(`${data.name} updated successfully!`);
      } else {
        await addDoc(collection(db, 'players'), playerData);
        toast.success(`${data.name} added successfully!`);
      }

      navigate('/admin/players');
    } catch (error) {
      console.error('Error saving player:', error);
      toast.error('Failed to save player');
    } finally {
      setLoading(false);
    }
  }

  if (loading && isEditMode) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-island-blue-200 border-t-island-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading player...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Edit Player' : 'Add New Player'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditMode ? 'Update player information' : 'Fill in the details to add a new player to your roster'}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/players')}
            className="flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo Upload */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Player Photo</h2>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-island-blue-400 to-cricket-green-400 flex items-center justify-center overflow-hidden">
                {photoPreview || existingPhoto ? (
                  <img
                    src={photoPreview || existingPhoto}
                    alt="Player photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-16 h-16 text-white" />
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-island-blue-500 text-white rounded-lg hover:bg-island-blue-600 transition-colors inline-flex">
                    <Upload className="w-5 h-5" />
                    Upload Photo
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  JPG, PNG or GIF (max 5MB)
                </p>
              </div>
            </div>
          </Card>

          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Player Name *
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter player name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Role *
                </label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select role</option>
                  <option value="Batsman">Batsman</option>
                  <option value="Allrounder">Allrounder</option>
                  <option value="Bowler">Bowler</option>
                  <option value="WK-Batsman">WK-Batsman</option>
                </select>
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                )}
              </div>

              {/* Batting Hand */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Batting Hand
                </label>
                <select
                  {...register('battingHand')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select batting hand</option>
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                </select>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Position *
                </label>
                <select
                  {...register('position', { required: 'Position is required' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select position</option>
                  <option value="Principal">Principal</option>
                  <option value="Director">Director</option>
                  <option value="Captain">Captain</option>
                  <option value="Vice Captain">Vice Captain</option>
                  <option value="Associate VC">Associate VC</option>
                  <option value="Quality Director">Quality Director</option>
                  <option value="Player">Player</option>
                </select>
                {errors.position && (
                  <p className="text-red-500 text-sm mt-1">{errors.position.message}</p>
                )}
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  {...register('bio')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Brief description about the player..."
                />
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  {...register('contactPhone')}
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  {...register('contactEmail')}
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="player@example.com"
                />
              </div>
            </div>
          </Card>

          {/* Statistics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Player Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Matches Played
                </label>
                <input
                  {...register('matchesPlayed')}
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Runs
                </label>
                <input
                  {...register('runs')}
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Wickets
                </label>
                <input
                  {...register('wickets')}
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Catches
                </label>
                <input
                  {...register('catches')}
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              {selectedRole === 'WK-Batsman' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Stumpings
                  </label>
                  <input
                    {...register('stumpings')}
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Batting Average
                </label>
                <input
                  {...register('battingAverage')}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Strike Rate
                </label>
                <input
                  {...register('strikeRate')}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              {(selectedRole === 'Bowler' || selectedRole === 'Allrounder') && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Bowling Average
                    </label>
                    <input
                      {...register('bowlingAverage')}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Economy Rate
                    </label>
                    <input
                      {...register('economy')}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Status & Availability */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Status & Availability</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Attendance Rate (%)
                </label>
                <input
                  {...register('attendanceRate')}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-island-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    {...register('availability')}
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-island-blue-500 focus:ring-island-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Available for selection
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    {...register('isActive')}
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-island-blue-500 focus:ring-island-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Active player
                  </span>
                </label>
              </div>
            </div>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/admin/players')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isEditMode ? 'Update Player' : 'Add Player'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

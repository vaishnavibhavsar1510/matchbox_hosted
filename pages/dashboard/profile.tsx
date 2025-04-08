import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useUser } from '../../components/UserContext';
import Image from 'next/image';

export default function Profile() {
  const { userData, updateUserData } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    name: '',
    age: 0,
    location: '',
    bio: '',
    interests: [] as string[],
    personality: '',
    activityLevel: '',
    socialStyle: '',
    relationshipGoals: '',
    profileImage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (userData) {
      // Calculate age from birthdate
      const birthDate = new Date(userData.birthdate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      setProfile({
        name: userData.name || '',
        age,
        location: userData.location || '',
        bio: userData.bio || '',
        interests: userData.interests || [],
        personality: userData.personality || '',
        activityLevel: userData.activityLevel || '',
        socialStyle: userData.socialStyle || '',
        relationshipGoals: userData.relationshipGoals || '',
        profileImage: userData.profileImage || '',
      });
      
      if (userData.profileImage) {
        setImagePreview(userData.profileImage);
      }
    }
  }, [userData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    try {
      setError('');
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/user/upload-profile-picture', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }

      // Update local state
      setProfile(prev => ({ ...prev, profileImage: data.imageUrl }));
      
      // Update user data context
      if (updateUserData) {
        await updateUserData({
          ...userData,
          profileImage: data.imageUrl,
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
      setImagePreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await updateUserData({
        name: profile.name,
        location: profile.location,
        bio: profile.bio,
        interests: profile.interests,
        personality: profile.personality,
        activityLevel: profile.activityLevel,
        socialStyle: profile.socialStyle,
        relationshipGoals: profile.relationshipGoals,
        profileImage: profile.profileImage,
      });

      // Show success message or notification
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#0A0F29] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-semibold text-purple-200 mb-4">Loading profile...</h2>
          <p className="text-purple-200/70">Please wait while we fetch your information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F29]">
      <Head>
        <title>Profile - MatchBox</title>
        <meta name="description" content="Your MatchBox profile" />
      </Head>

      <header className="bg-[#1E1B2E] shadow-lg border-b border-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
              MatchBox
            </h1>
            <nav className="flex space-x-4">
              <Link 
                href="/dashboard" 
                className="text-purple-300 hover:text-purple-200 transition-colors duration-200"
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="text-purple-300 hover:text-purple-200 transition-colors duration-200"
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#1E1B2E] rounded-lg shadow-lg p-6 border border-purple-900/20">
          <h2 className="text-2xl font-semibold text-white mb-6">Your Profile</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800/30 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                {imagePreview || profile.profileImage ? (
                  <img
                    src={imagePreview || profile.profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover shadow-lg ring-2 ring-purple-500/30 ring-offset-2 ring-offset-[#1E1B2E]"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-700 to-indigo-800 flex items-center justify-center text-white text-4xl font-medium shadow-lg ring-2 ring-purple-500/30 ring-offset-2 ring-offset-[#1E1B2E]">
                    {profile.name.charAt(0)}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 rounded-full p-2 shadow-lg transform transition-transform duration-200 hover:scale-110 border border-purple-500/30"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-purple-200/70">
                Click to upload your profile picture
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-purple-200 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-purple-900/20 text-purple-200 placeholder-purple-400/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30 border border-purple-800/30"
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-purple-200 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                  className="w-full bg-purple-900/20 text-purple-200 placeholder-purple-400/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30 border border-purple-800/30"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-purple-200 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full bg-purple-900/20 text-purple-200 placeholder-purple-400/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30 border border-purple-800/30"
                />
              </div>

              <div>
                <label htmlFor="personality" className="block text-sm font-medium text-purple-200 mb-2">
                  Personality Type
                </label>
                <select
                  id="personality"
                  value={profile.personality}
                  onChange={(e) => setProfile({ ...profile, personality: e.target.value })}
                  className="w-full bg-purple-900/20 text-purple-200 placeholder-purple-400/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30 border border-purple-800/30"
                >
                  <option value="Introverted">Introverted</option>
                  <option value="Ambivert">Ambivert</option>
                  <option value="Extroverted">Extroverted</option>
                </select>
              </div>

              <div>
                <label htmlFor="activityLevel" className="block text-sm font-medium text-purple-200 mb-2">
                  Activity Level
                </label>
                <select
                  id="activityLevel"
                  value={profile.activityLevel}
                  onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value })}
                  className="w-full bg-purple-900/20 text-purple-200 placeholder-purple-400/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30 border border-purple-800/30"
                >
                  <option value="Sedentary">Sedentary</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Active">Active</option>
                  <option value="Very Active">Very Active</option>
                </select>
              </div>

              <div>
                <label htmlFor="socialStyle" className="block text-sm font-medium text-purple-200 mb-2">
                  Social Style
                </label>
                <select
                  id="socialStyle"
                  value={profile.socialStyle}
                  onChange={(e) => setProfile({ ...profile, socialStyle: e.target.value })}
                  className="w-full bg-purple-900/20 text-purple-200 placeholder-purple-400/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30 border border-purple-800/30"
                >
                  <option value="Reserved">Reserved</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Outgoing">Outgoing</option>
                </select>
              </div>

              <div>
                <label htmlFor="relationshipGoals" className="block text-sm font-medium text-purple-200 mb-2">
                  Relationship Goals
                </label>
                <select
                  id="relationshipGoals"
                  value={profile.relationshipGoals}
                  onChange={(e) => setProfile({ ...profile, relationshipGoals: e.target.value })}
                  className="w-full bg-purple-900/20 text-purple-200 placeholder-purple-400/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30 border border-purple-800/30"
                >
                  <option value="Casual">Casual</option>
                  <option value="Short-term">Short-term</option>
                  <option value="Long-term">Long-term</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-purple-200 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full bg-purple-900/20 text-purple-200 placeholder-purple-400/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30 border border-purple-800/30 h-32 resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Interests</label>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-900/20 text-purple-200 rounded-full text-sm flex items-center border border-purple-800/20"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => {
                        const newInterests = [...profile.interests];
                        newInterests.splice(index, 1);
                        setProfile({ ...profile, interests: newInterests });
                      }}
                      className="ml-2 text-purple-300 hover:text-purple-200 transition-colors duration-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newInterest = prompt('Add a new interest:');
                    if (newInterest) {
                      setProfile({
                        ...profile,
                        interests: [...profile.interests, newInterest],
                      });
                    }
                  }}
                  className="px-3 py-1 border border-purple-800/30 text-purple-300 rounded-full text-sm hover:bg-purple-900/20 transition-all duration-200"
                >
                  + Add Interest
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 text-white rounded-lg hover:shadow-lg hover:shadow-purple-900/30 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 
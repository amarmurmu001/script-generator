"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import AuthCheck from '@/components/auth-check';
import { User, Mail, Key } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    bio: '',
    website: '',
    createdAt: '',
    lastLogin: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setProfileData({
            ...userDoc.data(),
            email: user.email,
            displayName: user.displayName || userDoc.data().displayName || '',
          });
        } else {
          // Create a new user profile if it doesn't exist
          const newUserData = {
            displayName: user.displayName || '',
            email: user.email,
            bio: '',
            website: '',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          await setDoc(userDocRef, newUserData);
          setProfileData(newUserData);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: profileData.displayName,
        bio: profileData.bio,
        website: profileData.website,
        updatedAt: new Date().toISOString(),
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      setError('Failed to logout');
    }
  };

  return (
    <AuthCheck>
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] py-6 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-[#171717] shadow rounded-lg">
            <div className="px-4 py-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Profile Settings
                </h2>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Logout
                </Button>
              </div>

              {error && (
                <div className="mb-4 p-3 text-sm sm:text-base bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 text-sm sm:text-base bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded">
                  {success}
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 text-sm sm:text-base h-9 sm:h-10"
                      placeholder="Your display name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <Input
                      type="email"
                      value={profileData.email}
                      disabled={true}
                      className="pl-10 text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <div className="mt-1">
                    <textarea
                      rows={3}
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      disabled={!isEditing}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full text-sm sm:text-base border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#202020] dark:text-white p-2 sm:p-3"
                      placeholder="Tell us about yourself"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <div className="mt-1">
                    <Input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      disabled={!isEditing}
                      className="text-sm sm:text-base h-9 sm:h-10"
                      placeholder="https://your-website.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  {!isEditing ? (
                    <Button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 h-9 sm:h-10 text-sm sm:text-base"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 h-9 sm:h-10 text-sm sm:text-base"
                      >
                        Save Changes
                      </Button>
                    </>
                  )}
                </div>
              </form>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Account Information</h3>
                <dl className="mt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account created</dt>
                    <dd className="text-sm text-gray-900 dark:text-gray-300">
                      {new Date(profileData.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last login</dt>
                    <dd className="text-sm text-gray-900 dark:text-gray-300">
                      {new Date(profileData.lastLogin).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
} 
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '../../components/UserContext';
import { useSession } from 'next-auth/react';

type PreferenceStep = {
  id: string;
  title: string;
  description: string;
  fields: {
    id: string;
    type: 'select' | 'multiselect' | 'range' | 'text' | 'radio';
    label: string;
    options?: string[];
    placeholder?: string;
    min?: number;
    max?: number;
  }[];
};

const preferenceSteps: PreferenceStep[] = [
  {
    id: 'basics',
    title: 'Basic Preferences',
    description: 'Let\'s start with some basic preferences to help us find your ideal matches.',
    fields: [
      {
        id: 'looking_for',
        type: 'radio',
        label: 'I am interested in',
        options: ['Men', 'Women', 'Everyone'],
      },
      {
        id: 'age_range',
        type: 'range',
        label: 'Age Range',
        min: 18,
        max: 100,
      },
      {
        id: 'location_preference',
        type: 'select',
        label: 'Location Preference',
        options: ['Within 5 miles', 'Within 10 miles', 'Within 25 miles', 'Within 50 miles', 'Any distance'],
      },
    ],
  },
  {
    id: 'personality',
    title: 'Personality & Interests',
    description: 'Tell us about yourself so we can find people who share your interests and values.',
    fields: [
      {
        id: 'interests',
        type: 'multiselect',
        label: 'What are your main interests?',
        options: [
          'Art & Culture',
          'Sports & Fitness',
          'Food & Cooking',
          'Travel & Adventure',
          'Music & Entertainment',
          'Technology',
          'Nature & Outdoors',
          'Reading & Literature',
          'Gaming',
          'Photography',
        ],
      },
      {
        id: 'personality_type',
        type: 'select',
        label: 'How would you describe your personality?',
        options: [
          'Outgoing & Social',
          'Reserved & Thoughtful',
          'Creative & Artistic',
          'Analytical & Logical',
          'Adventurous & Spontaneous',
          'Organized & Structured',
        ],
      },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle & Values',
    description: 'Help us understand your lifestyle and what matters most to you.',
    fields: [
      {
        id: 'activity_level',
        type: 'select',
        label: 'What\'s your typical activity level?',
        options: [
          'Very Active - I exercise daily',
          'Active - I exercise 3-5 times a week',
          'Moderate - I exercise occasionally',
          'Relaxed - I prefer low-key activities',
        ],
      },
      {
        id: 'social_style',
        type: 'select',
        label: 'What\'s your ideal social setting?',
        options: [
          'Large social gatherings',
          'Small group activities',
          'One-on-one interactions',
          'Mix of different settings',
        ],
      },
      {
        id: 'relationship_goals',
        type: 'select',
        label: 'What are you looking for?',
        options: [
          'Long-term relationship',
          'Casual dating',
          'Making new friends',
          'Let\'s see what happens',
        ],
      },
    ],
  },
  {
    id: 'dealbreakers',
    title: 'Deal Breakers',
    description: 'Let us know what\'s absolutely essential for you in a match.',
    fields: [
      {
        id: 'must_haves',
        type: 'multiselect',
        label: 'Must-haves in a potential match:',
        options: [
          'Similar education level',
          'Shared religious beliefs',
          'Similar political views',
          'Wants children',
          'Doesn\'t want children',
          'Non-smoker',
          'Doesn\'t drink',
          'Has a stable career',
        ],
      },
      {
        id: 'dealbreakers',
        type: 'multiselect',
        label: 'Absolute deal-breakers:',
        options: [
          'Smoking',
          'Heavy drinking',
          'Different religious views',
          'Different political views',
          'Different life goals',
          'Long distance',
        ],
      },
    ],
  },
];

export default function Preferences() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin?callbackUrl=/onboarding/preferences');
    },
  });
  const { userData, updateUserData } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-aurora-light flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <p className="text-aurora-dark">Loading...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // Validate current step fields
  const validateCurrentStep = () => {
    const currentFields = preferenceSteps[currentStep].fields;
    const missingFields: string[] = [];

    currentFields.forEach(field => {
      // Skip validation for age_range field
      if (field.id === 'age_range') {
        return;
      }

      const value = preferences[field.id];
      if (field.type === 'multiselect') {
        if (!Array.isArray(value) || value.length === 0) {
          missingFields.push(field.label);
        }
      } else if (!value || value === '') {
        missingFields.push(field.label);
      }
    });

    if (missingFields.length > 0) {
      setError(`Please fill in the following fields: ${missingFields.join(', ')}`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < preferenceSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!session?.user?.email) {
        router.push('/auth/signin?callbackUrl=/onboarding/preferences');
        return;
      }

      // Format the preferences data
      const preferencesToSubmit = {
        name: session.user.name || '',
        looking_for: preferences.looking_for,
        age_range: {
          min: parseInt(preferences.age_range_min) || 18,
          max: parseInt(preferences.age_range_max) || 100
        },
        location_preference: preferences.location_preference,
        interests: Array.isArray(preferences.interests) ? preferences.interests : [],
        personality: preferences.personality_type,
        activityLevel: preferences.activity_level,
        socialStyle: preferences.social_style,
        relationshipGoals: preferences.relationship_goals,
        must_haves: Array.isArray(preferences.must_haves) ? preferences.must_haves : [],
        dealbreakers: Array.isArray(preferences.dealbreakers) ? preferences.dealbreakers : []
      };

      // Update user data
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferencesToSubmit),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update preferences');
      }

      // Don't wait for the response data if we don't need it
      setIsLoading(false);
      
      // Redirect to dashboard immediately after successful update
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError(error instanceof Error ? error.message : 'Failed to save preferences');
      setIsLoading(false);
    }
  };

  const currentStepData = preferenceSteps[currentStep];

  return (
    <div className="min-h-screen bg-aurora-light">
      <Head>
        <title>Set Your Preferences | MatchBox</title>
        <meta name="description" content="Tell us your preferences to find better matches" />
      </Head>

      <div className="aurora-waves"></div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {preferenceSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex-1 h-2 rounded-full mx-1 ${
                    index <= currentStep ? 'bg-aurora-blue' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {/* Step Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-aurora-dark mb-2">{currentStepData.title}</h2>
            <p className="text-gray-600 mb-6">{currentStepData.description}</p>

            <form className="space-y-6">
              {currentStepData.fields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="form-label">
                    {field.label}
                    {field.id !== 'age_range' && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {field.id === 'age_range' && (
                      <span className="text-gray-500 ml-1">(optional)</span>
                    )}
                  </label>

                  {field.type === 'select' && (
                    <select
                      id={field.id}
                      className={`input-field ${!preferences[field.id] && field.id !== 'age_range' ? 'border-red-300' : ''}`}
                      value={preferences[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'multiselect' && (
                    <div className="grid grid-cols-2 gap-2">
                      {field.options?.map((option) => (
                        <label
                          key={option}
                          className={`flex items-center space-x-2 p-2 rounded border hover:bg-aurora-light cursor-pointer ${
                            (!preferences[field.id] || preferences[field.id].length === 0) ? 'border-red-300' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={option}
                            checked={
                              (preferences[field.id] || []).includes(option)
                            }
                            onChange={(e) => {
                              const current = preferences[field.id] || [];
                              const value = e.target.value;
                              handleInputChange(
                                field.id,
                                e.target.checked
                                  ? [...current, value]
                                  : current.filter((v: string) => v !== value)
                              );
                            }}
                            className="rounded text-aurora-blue focus:ring-aurora-blue"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'radio' && (
                    <div className={`flex space-x-4 ${!preferences[field.id] && field.id !== 'age_range' ? 'border border-red-300 p-2 rounded' : ''}`}>
                      {field.options?.map((option) => (
                        <label
                          key={option}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="radio"
                            name={field.id}
                            value={option}
                            checked={preferences[field.id] === option}
                            onChange={(e) =>
                              handleInputChange(field.id, e.target.value)
                            }
                            className="text-aurora-blue focus:ring-aurora-blue"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'range' && (
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        min={field.min}
                        max={field.max}
                        value={
                          preferences[`${field.id}_min`] ||
                          field.min ||
                          ''
                        }
                        onChange={(e) =>
                          handleInputChange(
                            `${field.id}_min`,
                            parseInt(e.target.value)
                          )
                        }
                        className="input-field w-24"
                        placeholder="18"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        min={field.min}
                        max={field.max}
                        value={
                          preferences[`${field.id}_max`] ||
                          field.max ||
                          ''
                        }
                        onChange={(e) =>
                          handleInputChange(
                            `${field.id}_max`,
                            parseInt(e.target.value)
                          )
                        }
                        className="input-field w-24"
                        placeholder="100"
                      />
                    </div>
                  )}
                </div>
              ))}
            </form>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handleBack}
                className={`btn btn-secondary ${
                  currentStep === 0 ? 'invisible' : ''
                }`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading
                  ? 'Saving...'
                  : currentStep === preferenceSteps.length - 1
                  ? 'Finish'
                  : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
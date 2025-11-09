import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Happening, HappeningType } from '../types';
import FeedItem from '../components/FeedItem';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import PendingFriendRequests from '../components/PendingFriendRequests';

const happeningTypes: { value: HappeningType; label: string }[] = [
  { value: 'CREATED_ACCOUNT', label: 'Account Creations' },
  { value: 'SENT_FRIEND_REQUEST', label: 'Friend Requests Sent' },
  { value: 'ACCEPTED_FRIEND_REQUEST', label: 'Friend Requests Accepted' },
  { value: 'REJECTED_FRIEND_REQUEST', label: 'Friend Requests Rejected' },
  { value: 'REMOVED_FRIEND', label: 'Friends Removed' },
  { value: 'MADE_BEST_FRIEND', label: 'Best Friends Made' },
  { value: 'REMOVED_BEST_FRIEND', label: 'Best Friends Removed' },
  { value: 'FOLLOWED_USER', label: 'Follows' },
  { value: 'UNFOLLOWED_USER', label: 'Unfollows' },
  { value: 'HID_USER', label: 'Users Hidden' },
  { value: 'UNHID_USER', label: 'Users Unhidden' },
  { value: 'VIEWED_PROFILE', label: 'Profile Views' },
];

const FeedSkeleton: React.FC = () => (
    <div className="bg-secondary p-4 rounded-lg border border-gray-800 flex items-start gap-4 overflow-hidden relative">
        <div className="w-10 h-10 rounded-full shrink-0 bg-primary/80"></div>
        <div className="flex-grow min-w-0 space-y-2">
            <div className="h-4 bg-primary/80 rounded w-3/4"></div>
            <div className="h-3 bg-primary/80 rounded w-1/2"></div>
            <div className="h-3 bg-primary/80 rounded w-1/4"></div>
        </div>
        <div className="w-10 h-10 rounded-full shrink-0 bg-primary/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent -translate-x-full animate-shimmer"></div>
    </div>
);


const HomePage: React.FC = () => {
  const { profile } = useAuth();
  const [happenings, setHappenings] = useState<Happening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<'personal' | 'global'>('personal');
  const [filterType, setFilterType] = useState<HappeningType | 'all'>('all');
  const [refreshRequests, setRefreshRequests] = useState(0);

  const fetchFeed = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);

    let query = supabase
      .from('happenings')
      .select('*, actor:actor_id(*), target:target_id(*)');

    if (filterType !== 'all') {
      query = query.eq('action_type', filterType);
    }

    if (feedType === 'global') {
      const { data: hidden, error: hiddenError } = await supabase.from('hidden_users').select('hidden_user_id').eq('user_id', profile.id);
      if (hiddenError) {
        setError('Could not fetch hidden users for global feed.');
        setLoading(false);
        return;
      }
      const hiddenIds = (hidden || []).map(h => h.hidden_user_id);
      if (hiddenIds.length > 0) {
        query = query.not('actor_id', 'in', `(${hiddenIds.join(',')})`);
      }
    } else { // Personal feed
      const { data: friends1, error: f1Error } = await supabase.from('friendships').select('user_id_2').eq('user_id_1', profile.id).eq('status', 'accepted');
      const { data: friends2, error: f2Error } = await supabase.from('friendships').select('user_id_1').eq('user_id_2', profile.id).eq('status', 'accepted');
      const { data: following, error: followError } = await supabase.from('follows').select('following_id').eq('follower_id', profile.id);
      const { data: hidden, error: hiddenError } = await supabase.from('hidden_users').select('hidden_user_id').eq('user_id', profile.id);
      
      if (f1Error || f2Error || followError || hiddenError) {
          setError('Failed to fetch user relationships.');
          setLoading(false);
          return;
      }

      const friendIds = [...(friends1 || []).map(f => f.user_id_2), ...(friends2 || []).map(f => f.user_id_1)];
      const followingIds = (following || []).map(f => f.following_id);
      const hiddenIds = (hidden || []).map(h => h.hidden_user_id);

      const relevantUserIds = [...new Set([...friendIds, ...followingIds, profile.id])];
      const userIdsToFetch = relevantUserIds.filter(id => !hiddenIds.includes(id));
      
      const filterString = `actor_id.in.(${userIdsToFetch.join(',')}),target_id.eq.${profile.id}`;
      if (userIdsToFetch.length > 0) {
        query = query.or(filterString);
      } else {
        query = query.eq('target_id', profile.id);
      }
    }

    const { data, error: happeningsError } = await query
      .order('created_at', { ascending: false })
      .limit(50) as { data: Happening[], error: any };

    if (happeningsError) {
      setError('Failed to fetch happenings.');
      console.error(happeningsError);
    } else {
      setHappenings(data || []);
    }
    setLoading(false);
  }, [profile, feedType, filterType]);

  const onAction = () => {
    fetchFeed();
    setRefreshRequests(prev => prev + 1);
  };

  useEffect(() => {
    if (profile) {
      fetchFeed();
    }
  }, [fetchFeed, profile]);

  useEffect(() => {
    const channel = supabase
      .channel('public:happenings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'happenings' }, onAction)
      .subscribe();
    
    const friendshipsChannel = supabase
      .channel('public:friendships')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, onAction)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(friendshipsChannel);
    };
  }, [fetchFeed]);

  const TabButton: React.FC<{type: 'personal' | 'global', label: string}> = ({ type, label }) => (
    <button
      onClick={() => setFeedType(type)}
      className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
        feedType === type
          ? 'border-b-2 border-accent text-light'
          : 'border-b-2 border-transparent text-medium hover:text-light'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PendingFriendRequests key={refreshRequests} />

      <div>
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-accent">Feed</h1>
          <div className="w-full sm:w-auto sm:max-w-xs">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as HappeningType | 'all')}
              className="w-full bg-secondary border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">Filter by Action...</option>
              {happeningTypes.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="border-b border-gray-800 mb-4">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <TabButton type="personal" label="My Feed" />
            <TabButton type="global" label="Global Feed" />
          </nav>
        </div>
        
        {error && <div className="text-center text-red-500 mt-10">{error}</div>}

        <div className="space-y-4">
          {loading ? (
             Array.from({ length: 5 }).map((_, i) => <FeedSkeleton key={i} />)
          ) : !error && (
            <>
              {happenings.length > 0 ? (
                happenings.map((happening) => (
                  <FeedItem key={happening.id} happening={happening} />
                ))
              ) : (
                <p className="text-center text-medium pt-10">
                  {feedType === 'personal' 
                    ? "Your feed is empty. Find some users to befriend or follow!"
                    : "The global feed is quiet right now."
                  }
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;

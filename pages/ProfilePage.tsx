import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FullUserProfile, Happening, UserProfile } from '../types';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import FeedItem from '../components/FeedItem';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import UserListModal from '../components/UserListModal';
import EditProfileModal from '../components/EditProfileModal';
import {
    UserPlusIcon, UserMinusIcon, CheckIcon, RssIcon, WifiIcon, HeartIcon,
    NoSymbolIcon, ArrowPathIcon, PencilIcon
} from '@heroicons/react/24/outline';
import ProfilePageSkeleton from '../components/ProfilePageSkeleton';

const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { profile: currentUserProfile, isViewOnly } = useAuth();
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState<FullUserProfile | null>(null);
    const [happenings, setHappenings] = useState<Happening[]>([]);
    const [stats, setStats] = useState({ friends: 0, followers: 0, following: 0, hidden: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [modalContent, setModalContent] = useState<{ title: string; fetchUsers: () => Promise<UserProfile[]> } | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [coverImageError, setCoverImageError] = useState(false);

    const fetchProfileData = useCallback(async (isUpdate = false) => {
        if (!username || !currentUserProfile) return;
        
        if (!isUpdate) setLoading(true);
        setCoverImageError(false);

        try {
            const { data: userData, error: userError } = await supabase.from('users').select('*').eq('username', username).single();
            if (userError || !userData) {
                toast.error("User not found.");
                navigate('/home');
                return;
            }

            const [
                friendship, following, followed, bestFriend, bestFriendBy, hidden,
                profileHappenings, userStats
            ] = await Promise.all([
                supabase.from('friendships').select('*').or(`and(user_id_1.eq.${currentUserProfile.id},user_id_2.eq.${userData.id}),and(user_id_1.eq.${userData.id},user_id_2.eq.${currentUserProfile.id})`).maybeSingle(),
                supabase.from('follows').select('id', { head: true, count: 'exact' }).eq('follower_id', currentUserProfile.id).eq('following_id', userData.id).maybeSingle(),
                supabase.from('follows').select('id', { head: true, count: 'exact' }).eq('follower_id', userData.id).eq('following_id', currentUserProfile.id).maybeSingle(),
                supabase.from('best_friends').select('id', { head: true, count: 'exact' }).eq('user_id', currentUserProfile.id).eq('best_friend_id', userData.id).maybeSingle(),
                supabase.from('best_friends').select('id', { head: true, count: 'exact' }).eq('user_id', userData.id).eq('best_friend_id', currentUserProfile.id).maybeSingle(),
                supabase.from('hidden_users').select('id', { head: true, count: 'exact' }).eq('user_id', currentUserProfile.id).eq('hidden_user_id', userData.id).maybeSingle(),
                supabase.from('happenings').select(`*, actor:actor_id(*), target:target_id(*)`).or(`actor_id.eq.${userData.id},target_id.eq.${userData.id}`).order('created_at', { ascending: false }).limit(20),
                supabase.rpc('get_user_stats', { target_user_id: userData.id })
            ]);

            if (userStats.error) throw userStats.error;

            setStats({
                friends: userStats.data.friends,
                followers: userStats.data.followers,
                following: userStats.data.following,
                hidden: userStats.data.hidden,
            });

            const fullProfile: FullUserProfile = {
                ...(userData as UserProfile),
                is_friend: friendship.data?.status === 'accepted',
                is_friend_pending_me: friendship.data?.status === 'pending' && friendship.data?.user_id_2 === currentUserProfile.id,
                is_friend_pending_them: friendship.data?.status === 'pending' && friendship.data?.user_id_1 === currentUserProfile.id,
                is_following: !!following.count,
                is_followed_by: !!followed.count,
                is_best_friend: !!bestFriend.count,
                is_best_friend_by: !!bestFriendBy.count,
                is_hidden: !!hidden.count,
            };

            setProfile(fullProfile);
            setHappenings(profileHappenings.data as Happening[] || []);
            
            if (!isUpdate && currentUserProfile.id !== userData.id) {
                await supabase.from('happenings').insert({ actor_id: currentUserProfile.id, action_type: 'VIEWED_PROFILE', target_id: userData.id });
            }
        } catch(error: any) {
            toast.error(`Failed to load profile: ${error.message}`);
            navigate('/home');
        } finally {
            if (!isUpdate) setLoading(false);
        }
    }, [username, currentUserProfile, navigate]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    useEffect(() => {
        if (!profile?.id || !profile?.username) return;

        let refreshTimeout: ReturnType<typeof setTimeout>;
        const handleUpdate = () => {
            clearTimeout(refreshTimeout);
            refreshTimeout = setTimeout(() => {
                fetchProfileData(true);
            }, 500); // Debounce updates by 500ms
        };

        const channelId = `profile-page-${profile.id}`;
        const profileChannel = supabase.channel(channelId)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${profile.id}` }, handleUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'happenings', filter: `or(actor_id.eq.${profile.id},target_id.eq.${profile.id})` }, handleUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `or(user_id_1.eq.${profile.id},user_id_2.eq.${profile.id})` }, handleUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: `or(follower_id.eq.${profile.id},following_id.eq.${profile.id})` }, handleUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'best_friends', filter: `or(user_id.eq.${profile.id},best_friend_id.eq.${profile.id})` }, handleUpdate)
            .subscribe((status, err) => {
                if (err) toast.error("Real-time connection failed.");
            });

        return () => {
            clearTimeout(refreshTimeout);
            supabase.removeChannel(profileChannel);
        };
    }, [profile?.id, profile?.username, fetchProfileData]);


    const handleAction = async (actionName: string, actionFn: () => Promise<any>, successMessage: string, onSuccess?: () => void) => {
        if (isViewOnly) {
            toast.error("View-only accounts cannot perform actions.");
            return;
        }
        setActionLoading(actionName);
        try {
            const result = await actionFn();
            if (result && Array.isArray(result)) {
                for (const res of result) {
                    if (res && res.error) throw res.error;
                }
            } else if (result && result.error) {
                throw result.error;
            }
            toast.success(successMessage);
            onSuccess?.(); // Optimistic update
        } catch (error: any) {
            toast.error(error.message || 'An error occurred.');
        } finally {
            setActionLoading(null);
        }
    };

    const onAddFriend = () => handleAction('addFriend', () => Promise.all([
        supabase.from('friendships').insert({ user_id_1: currentUserProfile!.id, user_id_2: profile!.id }),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'SENT_FRIEND_REQUEST', target_id: profile!.id })
    ]), "Friend request sent!", () => setProfile(p => p && ({ ...p, is_friend_pending_them: true })));
    
    const onAcceptFriend = () => handleAction('acceptFriend', () => Promise.all([
        supabase.from('friendships').update({ status: 'accepted' }).or(`and(user_id_1.eq.${currentUserProfile!.id},user_id_2.eq.${profile!.id}),and(user_id_1.eq.${profile!.id},user_id_2.eq.${currentUserProfile!.id})`),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'ACCEPTED_FRIEND_REQUEST', target_id: profile!.id }),
        // Remove any follow relationships on friendship
        supabase.from('follows').delete().or(`and(follower_id.eq.${currentUserProfile!.id},following_id.eq.${profile!.id}),and(follower_id.eq.${profile!.id},following_id.eq.${currentUserProfile!.id})`)
    ]), "Friend request accepted!", () => setProfile(p => p && ({ ...p, is_friend: true, is_friend_pending_me: false, is_following: false })));

    const onRemoveFriend = () => handleAction('removeFriend', () => Promise.all([
        supabase.from('friendships').delete().or(`and(user_id_1.eq.${currentUserProfile!.id},user_id_2.eq.${profile!.id}),and(user_id_1.eq.${profile!.id},user_id_2.eq.${currentUserProfile!.id})`),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'REMOVED_FRIEND', target_id: profile!.id }),
        // Also remove any best friend relationships
        supabase.from('best_friends').delete().or(`and(user_id.eq.${currentUserProfile!.id},best_friend_id.eq.${profile!.id}),and(user_id.eq.${profile!.id},best_friend_id.eq.${currentUserProfile!.id})`)
    ]), "Friend removed.", () => setProfile(p => p && ({ ...p, is_friend: false, is_best_friend: false, is_best_friend_by: false })));

    const onFollow = () => handleAction('follow', () => Promise.all([
        supabase.from('follows').insert({ follower_id: currentUserProfile!.id, following_id: profile!.id }),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'FOLLOWED_USER', target_id: profile!.id })
    ]), `Now following ${profile?.display_name}`, () => setProfile(p => p && ({ ...p, is_following: true })));

    const onUnfollow = () => handleAction('unfollow', () => Promise.all([
        supabase.from('follows').delete().eq('follower_id', currentUserProfile!.id).eq('following_id', profile!.id),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'UNFOLLOWED_USER', target_id: profile!.id })
    ]), `Unfollowed ${profile?.display_name}`, () => setProfile(p => p && ({ ...p, is_following: false })));

    const onAddBestFriend = () => handleAction('addBestFriend', () => Promise.all([
        supabase.from('best_friends').insert({ user_id: currentUserProfile!.id, best_friend_id: profile!.id }),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'ADDED_BEST_FRIEND', target_id: profile!.id })
    ]), `${profile?.display_name} is now a best friend!`, () => setProfile(p => p && ({ ...p, is_best_friend: true })));

    const onRemoveBestFriend = () => handleAction('removeBestFriend', () => Promise.all([
        supabase.from('best_friends').delete().eq('user_id', currentUserProfile!.id).eq('best_friend_id', profile!.id),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'REMOVED_BEST_FRIEND', target_id: profile!.id })
    ]), `Removed ${profile?.display_name} from best friends.`, () => setProfile(p => p && ({ ...p, is_best_friend: false })));
    
    const onRemoveTheirBestFriendStatus = () => handleAction('removeTheirBfs', () => Promise.all([
        supabase.from('best_friends').delete().eq('user_id', profile!.id).eq('best_friend_id', currentUserProfile!.id),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'REJECTED_BEST_FRIEND_STATUS', target_id: profile!.id })
    ]), `Rejected best friend status from ${profile?.display_name}.`, () => setProfile(p => p && ({...p, is_best_friend_by: false})));

    const onHideUser = async () => {
        if (isViewOnly) {
            toast.error("View-only accounts cannot perform actions.");
            return;
        }
        setActionLoading('hide');
        try {
            const { count } = await supabase.from('hidden_users').select('*', { count: 'exact', head: true }).eq('user_id', currentUserProfile!.id);

            if (count !== null && count >= 10) {
                toast.error("You can only hide up to 10 users.");
                setActionLoading(null);
                return;
            }

            await handleAction('hide', () => Promise.all([
                supabase.from('hidden_users').insert({ user_id: currentUserProfile!.id, hidden_user_id: profile!.id }),
                supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'HID_USER', target_id: profile!.id })
            ]), `Hid ${profile?.display_name}.`, () => setProfile(p => p && ({ ...p, is_hidden: true })));
        } catch (error: any) {
            toast.error(error.message || 'An error occurred.');
            setActionLoading(null);
        }
    };


    const onUnhideUser = () => handleAction('unhide', () => Promise.all([
        supabase.from('hidden_users').delete().eq('user_id', currentUserProfile!.id).eq('hidden_user_id', profile!.id),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'UNHID_USER', target_id: profile!.id })
    ]), `Unhid ${profile?.display_name}.`, () => setProfile(p => p && ({ ...p, is_hidden: false })));
    
    const showUserList = (title: string, fetchUsers: () => Promise<UserProfile[]>) => {
        setModalContent({ title: `${title} of ${profile?.display_name}`, fetchUsers });
    };

    const fetchFriends = async (): Promise<UserProfile[]> => {
        const { data: friends1 } = await supabase.from('friendships').select('user_2_profile:user_id_2(*)').eq('user_id_1', profile!.id).eq('status', 'accepted');
        const { data: friends2 } = await supabase.from('friendships').select('user_1_profile:user_id_1(*)').eq('user_id_2', profile!.id).eq('status', 'accepted');
        const friends = [
            ...((friends1 as any[])?.flatMap(f => f.user_2_profile) || []),
            ...((friends2 as any[])?.flatMap(f => f.user_1_profile) || [])
        ];
        return friends.filter((p): p is UserProfile => !!p);
    };
    
    const fetchFollowers = async (): Promise<UserProfile[]> => {
        const { data } = await supabase.from('follows').select('follower:follower_id(*)').eq('following_id', profile!.id);
        const followers = (data as any[])?.flatMap(f => f.follower) || [];
        return followers.filter((p): p is UserProfile => !!p);
    };

    const fetchFollowing = async (): Promise<UserProfile[]> => {
        const { data } = await supabase.from('follows').select('following:following_id(*)').eq('follower_id', profile!.id);
        const following = (data as any[])?.flatMap(f => f.following) || [];
        return following.filter((p): p is UserProfile => !!p);
    };

    if (loading || !profile) {
        return <ProfilePageSkeleton />;
    }

    const isSelf = currentUserProfile?.id === profile.id;
    
    // Assumption: The view-only account has the username 'everett'.
    // This is required to prevent other users from interacting with this specific account.
    const isProfileOfViewOnlyUser = profile.username === 'everett';

    const StatItem: React.FC<{ label: string, value: number, onClick?: () => void }> = ({ label, value, onClick }) => (
        <button onClick={onClick} disabled={!onClick || value === 0} className="text-center disabled:cursor-default group">
            <p className="text-2xl font-bold text-light group-hover:text-accent transition-colors">{value}</p>
            <p className="text-sm text-medium group-hover:text-light transition-colors">{label}</p>
        </button>
    );

    return (
        <>
            {modalContent && (
                <UserListModal
                    title={modalContent.title}
                    fetchUsers={modalContent.fetchUsers}
                    onClose={() => setModalContent(null)}
                />
            )}
            {isEditModalOpen && (
                <EditProfileModal 
                    userProfile={profile}
                    onClose={() => setIsEditModalOpen(false)}
                    onProfileUpdate={() => { /* Real-time subscription handles updates */ }}
                />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {profile.is_banned && (
                    <div className="lg:col-span-3">
                        <Card className="border-red-500/50 bg-red-500/10">
                            <div className="flex items-center gap-4 text-red-400">
                                <NoSymbolIcon className="h-8 w-8 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-lg">This user is banned</h3>
                                    {profile.ban_reason && <p className="text-sm">Reason: {profile.ban_reason}</p>}
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
                <div className="lg:col-span-1 space-y-6">
                     <Card className="!p-0 overflow-hidden">
                        <div className="relative mb-16">
                            {profile.cover_image_url && !coverImageError ? (
                                <img 
                                    src={profile.cover_image_url} 
                                    alt="Cover" 
                                    className="h-32 w-full object-cover" 
                                    onError={() => setCoverImageError(true)}
                                />
                            ) : (
                                <div className="h-32 w-full bg-gradient-to-br from-accent/20 to-primary"></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/60 to-transparent"></div>
                             <div className="absolute -bottom-12 left-6">
                                <Avatar displayName={profile.display_name} imageUrl={profile.avatar_url} size="xl" className="border-4 border-secondary" />
                            </div>
                        </div>
                        <div className="px-6 pb-6">
                            <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                            <p className="text-medium text-lg">@{profile.username}</p>
                            {profile.is_followed_by && <p className="mt-2 text-xs bg-gray-700 text-light px-2 py-1 rounded-full inline-block">Follows you</p>}
                            {isSelf && <Button variant="secondary" className="mt-4 w-full" onClick={() => setIsEditModalOpen(true)}><PencilIcon className="h-4 w-4 mr-2" />Edit Profile</Button>}
                        </div>
                    </Card>
                     
                    {profile.bio && (
                        <Card>
                            <p className="text-light italic text-center">"{profile.bio}"</p>
                        </Card>
                    )}

                    <Card>
                        <div className="grid grid-cols-4 gap-4">
                            <StatItem label="Friends" value={stats.friends} onClick={() => showUserList('Friends', fetchFriends)} />
                            <StatItem label="Followers" value={stats.followers} onClick={() => showUserList('Followers', fetchFollowers)} />
                            <StatItem label="Following" value={stats.following} onClick={() => showUserList('Following', fetchFollowing)} />
                             <StatItem label="Hidden" value={stats.hidden} />
                        </div>
                    </Card>

                    {!isSelf && (
                        <Card>
                           {isProfileOfViewOnlyUser ? (
                               <p className="text-center text-medium p-4">This user account is view-only and does not support interactions.</p>
                           ) : !profile.is_banned ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        {/* Friendship Button */}
                                        {profile.is_friend ? (
                                            <Button variant="danger" onClick={onRemoveFriend} disabled={!!actionLoading} className="w-full">
                                                <UserMinusIcon className="h-5 w-5 mr-2" /> Unfriend
                                            </Button>
                                        ) : profile.is_friend_pending_me ? (
                                            <Button onClick={onAcceptFriend} disabled={!!actionLoading} className="w-full">
                                                <CheckIcon className="h-5 w-5 mr-2" /> Accept Request
                                            </Button>
                                        ) : profile.is_friend_pending_them ? (
                                            <Button disabled className="w-full">Request Sent</Button>
                                        ) : (
                                            <Button onClick={onAddFriend} disabled={!!actionLoading} className="w-full">
                                                <UserPlusIcon className="h-5 w-5 mr-2" /> Add Friend
                                            </Button>
                                        )}

                                        {/* Follow Action (only if not friends) */}
                                        {!profile.is_friend && !profile.is_friend_pending_me && !profile.is_friend_pending_them && (
                                            profile.is_following ? (
                                                <Button variant="secondary" onClick={onUnfollow} disabled={!!actionLoading} className="w-full">
                                                    <WifiIcon className="h-5 w-5 mr-2 -rotate-45" /> Unfollow
                                                </Button>
                                            ) : (
                                                <Button variant="secondary" onClick={onFollow} disabled={!!actionLoading} className="w-full">
                                                    <RssIcon className="h-5 w-5 mr-2" /> Follow
                                                </Button>
                                            )
                                        )}
                                    </div>

                                    {/* Secondary Actions */}
                                    {profile.is_friend && (
                                        <Button
                                            variant="secondary"
                                            onClick={profile.is_best_friend ? onRemoveBestFriend : onAddBestFriend}
                                            disabled={!!actionLoading}
                                        >
                                            <HeartIcon className="h-5 w-5 mr-2" />
                                            {profile.is_best_friend ? 'Remove Best Friend' : 'Add Best Friend'}
                                        </Button>
                                    )}
                                    <Button
                                        variant="secondary"
                                        onClick={profile.is_hidden ? onUnhideUser : onHideUser}
                                        disabled={!!actionLoading}
                                    >
                                        {profile.is_hidden ? <ArrowPathIcon className="h-5 w-5 mr-2" /> : <NoSymbolIcon className="h-5 w-5 mr-2" />}
                                        {profile.is_hidden ? 'Unhide User' : 'Hide User'}
                                    </Button>
                                    
                                    {/* Best Friend Status Notification */}
                                    {profile.is_best_friend_by && (
                                        <div className="text-center p-2 mt-2 bg-primary/70 rounded-md">
                                            <p className="text-sm text-light">{profile.display_name} considers you a best friend.</p>
                                            <button 
                                                onClick={onRemoveTheirBestFriendStatus}
                                                className="text-xs text-accent hover:underline mt-1 disabled:opacity-50"
                                                disabled={!!actionLoading}
                                            >
                                                {actionLoading === 'removeTheirBfs' ? 'Revoking...' : 'Revoke Status'}
                                             </button>
                                        </div>
                                    )}
                                </div>
                           ) : (
                                <p className="text-center text-medium p-4">Actions are disabled for banned users.</p>
                           )}
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold text-accent mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {happenings.length > 0 ? (
                            happenings.map((h) => <FeedItem key={h.id} happening={h} />)
                        ) : (
                            <Card><p className="text-medium text-center py-8">No recent activity.</p></Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfilePage;
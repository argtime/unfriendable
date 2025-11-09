import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FullUserProfile, Happening, UserProfile } from '../types';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import FeedItem from '../components/FeedItem';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import UserListModal from '../components/UserListModal';
import {
    UserPlusIcon, UserMinusIcon, CheckIcon, RssIcon, WifiIcon, HeartIcon,
    NoSymbolIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';

const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { profile: currentUserProfile } = useAuth();
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState<FullUserProfile | null>(null);
    const [happenings, setHappenings] = useState<Happening[]>([]);
    const [stats, setStats] = useState({ friends: 0, followers: 0, following: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [modalContent, setModalContent] = useState<{ title: string; fetchUsers: () => Promise<UserProfile[]> } | null>(null);

    const fetchProfileData = useCallback(async () => {
        if (!username || !currentUserProfile) return;
        
        const { data: userData, error: userError } = await supabase.from('users').select('*').eq('username', username).single();
        if (userError || !userData) {
            toast.error("User not found.");
            navigate('/');
            return;
        }

        const [
            friendship, following, followed, bestFriend, bestFriendBy, hidden,
            profileHappenings, friendsCount1, friendsCount2, followersCount, followingCount
        ] = await Promise.all([
            supabase.from('friendships').select('*').or(`and(user_id_1.eq.${currentUserProfile.id},user_id_2.eq.${userData.id}),and(user_id_1.eq.${userData.id},user_id_2.eq.${currentUserProfile.id})`).maybeSingle(),
            supabase.from('follows').select('id', { head: true, count: 'exact' }).eq('follower_id', currentUserProfile.id).eq('following_id', userData.id).maybeSingle(),
            supabase.from('follows').select('id', { head: true, count: 'exact' }).eq('follower_id', userData.id).eq('following_id', currentUserProfile.id).maybeSingle(),
            supabase.from('best_friends').select('id', { head: true, count: 'exact' }).eq('user_id', currentUserProfile.id).eq('best_friend_id', userData.id).maybeSingle(),
            supabase.from('best_friends').select('id', { head: true, count: 'exact' }).eq('user_id', userData.id).eq('best_friend_id', currentUserProfile.id).maybeSingle(),
            supabase.from('hidden_users').select('id', { head: true, count: 'exact' }).eq('user_id', currentUserProfile.id).eq('hidden_user_id', userData.id).maybeSingle(),
            supabase.from('happenings').select(`*, actor:actor_id(*), target:target_id(*)`).or(`actor_id.eq.${userData.id},target_id.eq.${userData.id}`).order('created_at', { ascending: false }).limit(20),
            supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('user_id_1', userData.id).eq('status', 'accepted'),
            supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('user_id_2', userData.id).eq('status', 'accepted'),
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userData.id),
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userData.id),
        ]);

        setStats({
            friends: (friendsCount1.count || 0) + (friendsCount2.count || 0),
            followers: followersCount.count || 0,
            following: followingCount.count || 0,
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
        
        if (currentUserProfile.id !== userData.id) {
            await supabase.from('happenings').insert({ actor_id: currentUserProfile.id, action_type: 'VIEWED_PROFILE', target_id: userData.id });
        }

        setLoading(false);
    }, [username, currentUserProfile, navigate]);

    useEffect(() => {
        setLoading(true);
        fetchProfileData();
    }, [fetchProfileData]);

    const handleAction = async (actionName: string, actionFn: () => Promise<any>, successMessage: string) => {
        setActionLoading(actionName);
        try {
            const result = await actionFn();
            if (result && result.error) throw result.error;
            toast.success(successMessage);
            await fetchProfileData();
        } catch (error: any) {
            toast.error(error.message || 'An error occurred.');
        } finally {
            setActionLoading(null);
        }
    };

    const onAddFriend = () => handleAction('addFriend', () => Promise.all([
        supabase.from('friendships').insert({ user_id_1: currentUserProfile!.id, user_id_2: profile!.id }),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'SENT_FRIEND_REQUEST', target_id: profile!.id })
    ]), "Friend request sent!");
    
    const onAcceptFriend = () => handleAction('acceptFriend', () => Promise.all([
        supabase.from('friendships').update({ status: 'accepted' }).or(`and(user_id_1.eq.${currentUserProfile!.id},user_id_2.eq.${profile!.id}),and(user_id_1.eq.${profile!.id},user_id_2.eq.${currentUserProfile!.id})`),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'ACCEPTED_FRIEND_REQUEST', target_id: profile!.id })
    ]), "Friend request accepted!");

    const onRemoveFriend = () => handleAction('removeFriend', () => Promise.all([
        supabase.from('friendships').delete().or(`and(user_id_1.eq.${currentUserProfile!.id},user_id_2.eq.${profile!.id}),and(user_id_1.eq.${profile!.id},user_id_2.eq.${currentUserProfile!.id})`),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'REMOVED_FRIEND', target_id: profile!.id })
    ]), "Friend removed.");

    const onFollow = () => handleAction('follow', () => Promise.all([
        supabase.from('follows').insert({ follower_id: currentUserProfile!.id, following_id: profile!.id }),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'FOLLOWED_USER', target_id: profile!.id })
    ]), `Now following ${profile?.display_name}`);

    const onUnfollow = () => handleAction('unfollow', () => Promise.all([
        supabase.from('follows').delete().eq('follower_id', currentUserProfile!.id).eq('following_id', profile!.id),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'UNFOLLOWED_USER', target_id: profile!.id })
    ]), `Unfollowed ${profile?.display_name}`);

    const onMakeBestFriend = () => handleAction('addBestFriend', () => Promise.all([
        supabase.from('best_friends').insert({ user_id: currentUserProfile!.id, best_friend_id: profile!.id }),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'MADE_BEST_FRIEND', target_id: profile!.id })
    ]), `${profile?.display_name} is now a best friend!`);

    const onRemoveBestFriend = () => handleAction('removeBestFriend', () => Promise.all([
        supabase.from('best_friends').delete().eq('user_id', currentUserProfile!.id).eq('best_friend_id', profile!.id),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'REMOVED_BEST_FRIEND', target_id: profile!.id })
    ]), `Removed ${profile?.display_name} from best friends.`);
    
    const onRemoveTheirBestFriendStatus = () => handleAction('removeTheirBfs', () => Promise.all([
        supabase.from('best_friends').delete().eq('user_id', profile!.id).eq('best_friend_id', currentUserProfile!.id),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'REJECTED_BEST_FRIEND_STATUS', target_id: profile!.id })
    ]), `Rejected best friend status from ${profile?.display_name}.`);

    const onHideUser = () => handleAction('hide', () => Promise.all([
        supabase.from('hidden_users').insert({ user_id: currentUserProfile!.id, hidden_user_id: profile!.id }),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'HID_USER', target_id: profile!.id })
    ]), `Hid ${profile?.display_name}.`);

    const onUnhideUser = () => handleAction('unhide', () => Promise.all([
        supabase.from('hidden_users').delete().eq('user_id', currentUserProfile!.id).eq('hidden_user_id', profile!.id),
        supabase.from('happenings').insert({ actor_id: currentUserProfile!.id, action_type: 'UNHID_USER', target_id: profile!.id })
    ]), `Unhid ${profile?.display_name}.`);
    
    const showUserList = (title: string, fetchUsers: () => Promise<UserProfile[]>) => {
        setModalContent({ title: `${title} of ${profile?.display_name}`, fetchUsers });
    };

    const fetchFriends = async (): Promise<UserProfile[]> => {
        const { data: friends1 } = await supabase.from('friendships').select('user_2_profile:user_id_2(*)').eq('user_id_1', profile!.id).eq('status', 'accepted');
        const { data: friends2 } = await supabase.from('friendships').select('user_1_profile:user_id_1(*)').eq('user_id_2', profile!.id).eq('status', 'accepted');
        const friends = [...(friends1?.map(f => f.user_2_profile) || []), ...(friends2?.map(f => f.user_1_profile) || [])];
        // Fix: Use a type guard to correctly filter out null/undefined values and satisfy TypeScript's type checker.
        return friends.filter((p): p is UserProfile => !!p);
    };
    
    const fetchFollowers = async (): Promise<UserProfile[]> => {
        const { data } = await supabase.from('follows').select('follower:follower_id(*)').eq('following_id', profile!.id);
        // Fix: Use a type guard to correctly filter out null/undefined values and satisfy TypeScript's type checker.
        return (data?.map(f => f.follower).filter((p): p is UserProfile => !!p)) || [];
    };

    const fetchFollowing = async (): Promise<UserProfile[]> => {
        const { data } = await supabase.from('follows').select('following:following_id(*)').eq('follower_id', profile!.id);
        // Fix: Use a type guard to correctly filter out null/undefined values and satisfy TypeScript's type checker.
        return (data?.map(f => f.following).filter((p): p is UserProfile => !!p)) || [];
    };

    if (loading || !profile) {
        return <div className="flex justify-center mt-10"><Spinner size="lg" /></div>;
    }

    const isSelf = currentUserProfile?.id === profile.id;

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
                    <div className="relative">
                        <div className="h-24 md:h-32 rounded-t-lg bg-gradient-to-br from-accent/20 to-primary"></div>
                        <div className="p-6 pt-0">
                            <Avatar displayName={profile.display_name} size="xl" className="mx-auto -mt-12 mb-4 border-4 border-secondary" />
                            <div className="text-center">
                                <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                                <p className="text-medium text-lg">@{profile.username}</p>
                                {profile.is_followed_by && <p className="mt-2 text-xs bg-gray-700 text-light px-2 py-1 rounded-full inline-block">Follows you</p>}
                            </div>
                        </div>
                    </div>

                    <Card>
                        <div className="grid grid-cols-3 gap-4">
                            <StatItem label="Friends" value={stats.friends} onClick={() => showUserList('Friends', fetchFriends)} />
                            <StatItem label="Followers" value={stats.followers} onClick={() => showUserList('Followers', fetchFollowers)} />
                            <StatItem label="Following" value={stats.following} onClick={() => showUserList('Following', fetchFollowing)} />
                        </div>
                    </Card>

                    {!isSelf && (
                        <Card>
                           {!profile.is_banned ? (
                                <div className="flex flex-col gap-3">
                                    {/* Friend Actions */}
                                    {profile.is_friend ? (
                                        <Button variant="danger" onClick={onRemoveFriend} loading={actionLoading === 'removeFriend'}><UserMinusIcon className="h-5 w-5 mr-2" />Remove Friend</Button>
                                    ) : profile.is_friend_pending_me ? (
                                        <Button onClick={onAcceptFriend} loading={actionLoading === 'acceptFriend'}><CheckIcon className="h-5 w-5 mr-2" />Accept Friend Request</Button>
                                    ) : profile.is_friend_pending_them ? (
                                        <Button disabled>Friend Request Sent</Button>
                                    ) : (
                                        <Button onClick={onAddFriend} loading={actionLoading === 'addFriend'}><UserPlusIcon className="h-5 w-5 mr-2" />Add Friend</Button>
                                    )}

                                    {/* Follow Actions */}
                                    {profile.is_following ? (
                                        <Button variant="secondary" onClick={onUnfollow} loading={actionLoading === 'unfollow'}><WifiIcon className="h-5 w-5 mr-2 rotate-45" />Unfollow</Button>
                                    ) : (
                                        <Button variant="secondary" onClick={onFollow} loading={actionLoading === 'follow'}><RssIcon className="h-5 w-5 mr-2" />Follow</Button>
                                    )}
                                    
                                    {/* Best Friend Actions */}
                                    {profile.is_friend && (
                                        <>
                                            <div className="border-t border-gray-700 my-1"></div>
                                            {profile.is_best_friend ? (
                                                <Button variant="secondary" onClick={onRemoveBestFriend} loading={actionLoading === 'removeBestFriend'}><HeartIcon className="h-5 w-5 mr-2" />Remove Best Friend</Button>
                                            ) : (
                                                <Button variant="secondary" onClick={onMakeBestFriend} loading={actionLoading === 'addBestFriend'}><HeartIcon className="h-5 w-5 mr-2" />Make Best Friend</Button>
                                            )}
                                            {profile.is_best_friend_by && (
                                                <div className="text-center p-2 bg-primary/70 rounded-md">
                                                    <p className="text-sm text-light">{profile.display_name} considers you a best friend.</p>
                                                    <button 
                                                        onClick={onRemoveTheirBestFriendStatus}
                                                        className="text-xs text-accent hover:underline mt-1 disabled:opacity-50"
                                                        disabled={actionLoading === 'removeTheirBfs'}
                                                    >
                                                        {actionLoading === 'removeTheirBfs' ? 'Revoking...' : 'Revoke Status'}
                                                     </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div className="border-t border-gray-700 my-1"></div>


                                    {/* Hide Actions */}
                                    {profile.is_hidden ? (
                                        <Button variant="secondary" onClick={onUnhideUser} loading={actionLoading === 'unhide'}><ArrowPathIcon className="h-5 w-5 mr-2" />Unhide User</Button>
                                    ) : (
                                        <Button variant="secondary" onClick={onHideUser} loading={actionLoading === 'hide'}><NoSymbolIcon className="h-5 w-5 mr-2" />Hide User</Button>
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
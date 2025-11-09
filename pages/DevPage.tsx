import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { UserProfile, Happening, Friendship, HappeningType } from '../types';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { XMarkIcon, TrashIcon, PencilIcon, PlusIcon, NoSymbolIcon, PowerIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import PlatformStats from '../components/PlatformStats';

// Types
type FriendshipWithProfiles = Friendship & { user_1_profile: UserProfile; user_2_profile: UserProfile; };
interface Follow { id: number; follower: UserProfile; following: UserProfile; }
interface UserDetails { friendships: FriendshipWithProfiles[]; followers: Follow[]; following: Follow[]; happenings: Happening[]; }

const happeningTypesArray = Object.keys({
  CREATED_ACCOUNT: '',
  SENT_FRIEND_REQUEST: '',
  ACCEPTED_FRIEND_REQUEST: '',
  REJECTED_FRIEND_REQUEST: '',
  REMOVED_FRIEND: '',
  MADE_BEST_FRIEND: '',
  REMOVED_BEST_FRIEND: '',
  REJECTED_BEST_FRIEND_STATUS: '',
  FOLLOWED_USER: '',
  UNFOLLOWED_USER: '',
  HID_USER: '',
  UNHID_USER: '',
  VIEWED_PROFILE: '',
} as Record<HappeningType, string>);


// #region Modals
const ManageUserModal: React.FC<{ user: UserProfile, onClose: () => void, onDataChange: () => void }> = ({ user: initialUser, onClose, onDataChange }) => {
  const [user, setUser] = useState(initialUser);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, friendships, followers, following, happenings] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('friendships').select('*, user_1_profile:user_id_1(*), user_2_profile:user_id_2(*)').or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`).eq('status', 'accepted'),
        supabase.from('follows').select('*, follower:follower_id(*)').eq('following_id', user.id),
        supabase.from('follows').select('*, following:following_id(*)').eq('follower_id', user.id),
        supabase.from('happenings').select('*, actor:actor_id(*), target:target_id(*)').or(`actor_id.eq.${user.id},target_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(50),
      ]);
      
      if (userRes.data) setUser(userRes.data);
      
      setDetails({
        friendships: (friendships.data as any) || [],
        followers: (followers.data as any) || [],
        following: (following.data as any) || [],
        happenings: (happenings.data as any) || [],
      });
    } catch(err: any) {
        toast.error(`Could not load user details: ${err.message}`)
    } finally {
        setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdminAction = async (
    action: () => PromiseLike<{ error: any }>,
    successMessage: string
  ) => {
    setActionLoading(true);
    try {
      const { error } = await action();
      if (error) throw error;
      toast.success(successMessage);
      await fetchData();
      onDataChange();
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleSignOutUser = () => {
    if (!window.confirm(`Are you sure you want to forcibly sign out ${user.display_name}? This will invalidate all their current sessions.`)) {
        return;
    }
    handleAdminAction(
        async () => {
            const { data, error } = await supabase.rpc('sign_out_user', { target_user_id: user.id });
            if (error) return { error };
            if (data?.error) return { error: { message: data.error }};
            return { error: null };
        },
        'User has been signed out successfully.'
    );
  };

  const deleteFriendship = (id: number) => handleAdminAction(() => supabase.from('friendships').delete().eq('id', id), 'Friendship removed.');
  const deleteFollow = (id: number) => handleAdminAction(() => supabase.from('follows').delete().eq('id', id), 'Follow removed.');
  const deleteHappening = (id: number) => handleAdminAction(() => supabase.from('happenings').delete().eq('id', id), 'Happening deleted.');
  

  const TabButton: React.FC<{ tab: string, label: string, count: number }> = ({ tab, label, count }) => (
    <button onClick={() => setActiveTab(tab)} className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-accent text-primary' : 'text-medium hover:bg-gray-700'}`}>
        {label} <span className="text-xs bg-primary text-light rounded-full px-2 py-0.5">{count}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
                <Avatar displayName={user.display_name} imageUrl={user.avatar_url} />
                <div>
                    <h2 className="text-xl font-bold text-light">{user.display_name}</h2>
                    <p className="text-sm text-medium">@{user.username}</p>
                </div>
                {user.is_banned && <span className="text-xs bg-red-600 text-light font-bold px-2 py-0.5 rounded-full">BANNED</span>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
        </header>

        {user.is_banned && (
            <div className="p-4 border-b border-gray-700 bg-red-900/30">
                <h3 className="text-lg font-semibold text-red-300 mb-2">Ban Status</h3>
                <p className="text-sm text-medium">Reason: <span className="text-light">{user.ban_reason || 'No reason provided.'}</span></p>
                {user.banned_at && <p className="text-xs text-medium mt-1">Banned on: {new Date(user.banned_at).toLocaleString()}</p>}
            </div>
        )}
        
        <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-light mb-3">Admin Actions</h3>
            <div className="flex gap-2">
                <Button 
                    variant="danger" 
                    onClick={handleSignOutUser}
                    loading={actionLoading}
                    disabled={actionLoading}
                >
                    <PowerIcon className="h-4 w-4 mr-2" />
                    Force Sign Out
                </Button>
            </div>
        </div>

        <div className="p-4 border-b border-gray-700 flex flex-wrap gap-2">
            {details && <>
                <TabButton tab="friends" label="Friends" count={details.friendships.length} />
                <TabButton tab="followers" label="Followers" count={details.followers.length} />
                <TabButton tab="following" label="Following" count={details.following.length} />
                <TabButton tab="activity" label="Activity" count={details.happenings.length} />
            </>}
        </div>

        <main className="overflow-y-auto flex-grow p-4">
          {loading ? <div className="flex justify-center py-10"><Spinner /></div> : 
            !details ? <p>No details found.</p> :
            <div className="space-y-2">
                {activeTab === 'friends' && details.friendships.map(f => {
                    const friend = f.user_id_1 === user.id ? f.user_2_profile : f.user_1_profile;
                    return <ListItem key={f.id} user={friend} onDelete={() => deleteFriendship(f.id)} />;
                })}
                {activeTab === 'followers' && details.followers.map(f => <ListItem key={f.id} user={f.follower} onDelete={() => deleteFollow(f.id)} />)}
                {activeTab === 'following' && details.following.map(f => <ListItem key={f.id} user={f.following} onDelete={() => deleteFollow(f.id)} />)}
                {activeTab === 'activity' && details.happenings.map(h => <ActivityItem key={h.id} happening={h} onDelete={() => deleteHappening(h.id)} />)}
            </div>
          }
        </main>
      </div>
    </div>
  );
};

const ManageHappeningModal: React.FC<{
    happening: Partial<Happening> | null,
    users: UserProfile[],
    onClose: () => void,
    onSave: () => void
}> = ({ happening, users, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Happening>>({
        actor_id: '',
        action_type: 'VIEWED_PROFILE',
        target_id: null,
        ...happening
    });
    const [loading, setLoading] = useState(false);

    const isEditing = !!formData.id;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            actor_id: formData.actor_id,
            action_type: formData.action_type,
            target_id: formData.target_id || null,
        };

        const { error } = isEditing
            ? await supabase.from('happenings').update(payload).eq('id', formData.id)
            : await supabase.from('happenings').insert(payload);

        setLoading(false);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success(`Happening ${isEditing ? 'updated' : 'created'} successfully!`);
            onSave();
            onClose();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <form className="bg-secondary rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()} onSubmit={handleSave}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-light">{isEditing ? 'Edit' : 'Create'} Happening</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-medium mb-1">Actor</label>
                        <select name="actor_id" value={formData.actor_id || ''} onChange={handleChange} required className="w-full bg-primary border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
                            <option value="" disabled>Select Actor</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.display_name} (@{u.username})</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-medium mb-1">Action Type</label>
                        <select name="action_type" value={formData.action_type} onChange={handleChange} required className="w-full bg-primary border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
                           {happeningTypesArray.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-medium mb-1">Target (Optional)</label>
                        <select name="target_id" value={formData.target_id || ''} onChange={handleChange} className="w-full bg-primary border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
                            <option value="">None</option>
                             {users.map(u => <option key={u.id} value={u.id}>{u.display_name} (@{u.username})</option>)}
                        </select>
                    </div>
                </main>
                <footer className="p-4 bg-primary/50 rounded-b-lg flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={loading}>{isEditing ? 'Save Changes' : 'Create'}</Button>
                </footer>
            </form>
        </div>
    );
};
// #endregion

// #region List Items
const ListItem: React.FC<{ user: UserProfile, onDelete: () => void }> = React.memo(({ user, onDelete }) => (
    <div className="flex justify-between items-center bg-primary p-2 rounded-md">
        <Link to={`/profile/${user.username}`} className="flex items-center gap-3">
            <Avatar displayName={user.display_name} imageUrl={user.avatar_url} size="sm" />
            <div>
                <p className="font-semibold">{user.display_name}</p>
                <p className="text-xs text-medium">@{user.username}</p>
            </div>
        </Link>
        <Button variant="secondary" className="!p-2" onClick={onDelete}><TrashIcon className="h-4 w-4 text-red-500" /></Button>
    </div>
));

const ActivityItem: React.FC<{ happening: Happening, onDelete: () => void }> = React.memo(({ happening, onDelete }) => (
    <div className="flex justify-between items-center bg-primary p-2 rounded-md text-sm">
        <p>
            <span className="font-bold text-accent">{happening.actor.display_name}</span> {happening.action_type.replace(/_/g, ' ').toLowerCase()} {happening.target && <span className="font-bold text-accent">{happening.target.display_name}</span>}
        </p>
        <div className="flex items-center gap-4">
             <span className="text-xs text-medium">{new Date(happening.created_at).toLocaleString()}</span>
             <Button variant="secondary" className="!p-2" onClick={onDelete}><TrashIcon className="h-4 w-4 text-red-500" /></Button>
        </div>
    </div>
));
// #endregion

const DevPage: React.FC = () => {
    const { isDev, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [happenings, setHappenings] = useState<Happening[]>([]);
    const [loading, setLoading] = useState(true);
    const [managingUser, setManagingUser] = useState<UserProfile | null>(null);
    const [editingHappening, setEditingHappening] = useState<Partial<Happening> | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'feed'>('users');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, happeningsRes] = await Promise.all([
                supabase.from('users').select('*').order('created_at', { ascending: false }),
                supabase.from('happenings').select('*, actor:actor_id(*), target:target_id(*)').order('created_at', { ascending: false }).limit(100),
            ]);

            if (usersRes.error) throw usersRes.error;
            setUsers(usersRes.data || []);
            
            if (happeningsRes.error) throw happeningsRes.error;
            setHappenings(happeningsRes.data as any[] || []);
        } catch (error: any) {
            toast.error(`Failed to fetch dev data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !isDev) navigate('/home');
    }, [isDev, authLoading, navigate]);

    useEffect(() => {
        if (isDev) fetchData();
    }, [isDev, fetchData]);
    
    const deleteHappening = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this happening?")) return;
        const { error } = await supabase.from('happenings').delete().eq('id', id);
        if (error) toast.error(error.message);
        else {
            toast.success("Happening deleted.");
            fetchData();
        }
    };

    if (authLoading || loading) return <div className="flex justify-center mt-10"><Spinner /></div>;
    if (!isDev) return null;

    const TabButton: React.FC<{ tab: 'users' | 'feed', label: string, count: number }> = ({ tab, label, count }) => (
        <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === tab ? 'border-b-2 border-accent text-light' : 'border-b-2 border-transparent text-medium hover:text-light'}`}>
            {label} <span className="text-xs bg-secondary rounded-full px-2">{count}</span>
        </button>
    );

    return (
        <>
            <Card>
                <h1 className="text-3xl font-bold text-accent mb-4">Developer Panel</h1>
                <p className="text-medium mb-6">Full administrative control over platform data.</p>
                
                <PlatformStats />

                <div className="border-b border-gray-800 my-6">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <TabButton tab="users" label="User Management" count={users.length} />
                        <TabButton tab="feed" label="Global Feed Management" count={happenings.length} />
                    </nav>
                </div>
                
                {activeTab === 'users' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-primary"><tr className="text-sm">
                                <th className="p-3">Display Name</th>
                                <th className="p-3">Username</th>
                                <th className="p-3 hidden md:table-cell">User ID</th>
                                <th className="p-3 hidden sm:table-cell">Created At</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr></thead>
                            <tbody>{users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                    <td className="p-3 flex items-center">
                                        <Avatar displayName={user.display_name} imageUrl={user.avatar_url} size="sm" className="mr-3" />
                                        {user.display_name}
                                        {user.is_banned && <span className="ml-2 text-xs bg-red-600 text-light font-bold px-2 py-0.5 rounded-full">BANNED</span>}
                                    </td>
                                    <td className="p-3 font-mono text-accent">@{user.username}</td>
                                    <td className="p-3 font-mono text-sm text-medium hidden md:table-cell">{user.id}</td>
                                    <td className="p-3 text-medium hidden sm:table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="p-3 text-right">
                                        <Button variant="secondary" onClick={() => setManagingUser(user)}>Manage</Button>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'feed' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button onClick={() => setEditingHappening({})}>
                                <PlusIcon className="h-5 w-5 mr-2" />Create Happening
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-primary"><tr>
                                    <th className="p-3">Actor</th>
                                    <th className="p-3">Action</th>
                                    <th className="p-3">Target</th>
                                    <th className="p-3 hidden sm:table-cell">Date</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr></thead>
                                <tbody>{happenings.map((h) => (
                                    <tr key={h.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="p-2 font-semibold text-accent">{h.actor?.display_name || 'N/A'}</td>
                                        <td className="p-2 text-medium">{h.action_type.replace(/_/g, ' ')}</td>
                                        <td className="p-2 font-semibold text-accent">{h.target?.display_name || 'None'}</td>
                                        <td className="p-2 text-medium hidden sm:table-cell">{new Date(h.created_at).toLocaleString()}</td>
                                        <td className="p-2 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="secondary" className="!p-2" onClick={() => setEditingHappening(h)}><PencilIcon className="h-4 w-4" /></Button>
                                                <Button variant="secondary" className="!p-2" onClick={() => deleteHappening(h.id)}><TrashIcon className="h-4 w-4 text-red-500" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Card>

            {managingUser && <ManageUserModal user={managingUser} onClose={() => setManagingUser(null)} onDataChange={fetchData}/>}
            {editingHappening && <ManageHappeningModal happening={editingHappening} users={users} onClose={() => setEditingHappening(null)} onSave={fetchData}/>}
        </>
    );
};

export default DevPage;
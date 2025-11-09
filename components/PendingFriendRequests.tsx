import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { UserProfile } from '../types';
import Spinner from './ui/Spinner';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface PendingRequest {
    id: number;
    user_1_profile: UserProfile;
}

const PendingFriendRequests: React.FC = () => {
    const { profile: currentUserProfile } = useAuth();
    const [requests, setRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchRequests = async () => {
            if (!currentUserProfile) return;
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase
                    .from('friendships')
                    .select('id, user_1_profile:user_id_1(*)')
                    .eq('user_id_2', currentUserProfile.id)
                    .eq('status', 'pending');

                if (fetchError) throw fetchError;
                setRequests(data as any[] || []);
            } catch (err: any) {
                setError("Couldn't load friend requests.");
                console.error("Failed to fetch pending requests", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, [currentUserProfile]);

    const handleAction = async (requestId: number, requesterId: string, action: 'accept' | 'reject') => {
        if (!currentUserProfile) return;
        setActionLoading(prev => ({ ...prev, [requestId]: true }));

        try {
            if (action === 'accept') {
                const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
                if (error) throw error;
                await supabase.from('happenings').insert({ actor_id: currentUserProfile.id, action_type: 'ACCEPTED_FRIEND_REQUEST', target_id: requesterId });
                toast.success('Friend request accepted!');
            } else {
                const { error } = await supabase.from('friendships').update({ status: 'rejected' }).eq('id', requestId);
                if (error) throw error;
                await supabase.from('happenings').insert({ actor_id: currentUserProfile.id, action_type: 'REJECTED_FRIEND_REQUEST', target_id: requesterId });
                toast.success('Friend request rejected.');
            }
            setRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (err: any) {
            toast.error(err.message || 'An error occurred.');
        } finally {
            setActionLoading(prev => ({ ...prev, [requestId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="bg-secondary p-4 rounded-lg border border-gray-800">
                <div className="flex justify-center items-center h-24">
                    <Spinner />
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="bg-secondary p-4 rounded-lg border border-red-800/60">
                <p className="text-center text-red-400">{error}</p>
            </div>
        );
    }


    if (requests.length === 0) {
        return null; // Don't show the card if there are no requests
    }

    return (
        <div className="bg-secondary p-4 rounded-lg border border-gray-800">
            <h2 className="text-lg font-bold mb-4 text-accent">
                Friend Requests ({requests.length})
            </h2>
            <div className="space-y-3">
                {requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between gap-2">
                        <Link to={`/profile/${req.user_1_profile.username}`} className="flex items-center gap-3 min-w-0">
                            <Avatar displayName={req.user_1_profile.display_name} imageUrl={req.user_1_profile.avatar_url} size="md" />
                            <div className="truncate">
                                <p className="font-semibold truncate">{req.user_1_profile.display_name}</p>
                                <p className="text-sm text-medium truncate">@{req.user_1_profile.username}</p>
                            </div>
                        </Link>
                        <div className="flex gap-2 shrink-0">
                            <Button 
                                onClick={() => handleAction(req.id, req.user_1_profile.id, 'accept')}
                                loading={actionLoading[req.id]}
                                className="!p-2"
                            >
                                <CheckIcon className="h-5 w-5" />
                            </Button>
                             <Button 
                                variant="danger" 
                                onClick={() => handleAction(req.id, req.user_1_profile.id, 'reject')}
                                loading={actionLoading[req.id]}
                                className="!p-2"
                             >
                                <XMarkIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingFriendRequests;
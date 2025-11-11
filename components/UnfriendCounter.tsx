import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { UserMinusIcon } from '@heroicons/react/24/outline';

const UnfriendCounter: React.FC = () => {
    const [count, setCount] = useState<number | null>(null);

    const fetchCount = useCallback(async () => {
        try {
            const { count: unfriendsCount, error } = await supabase
                .from('happenings')
                .select('*', { count: 'exact', head: true })
                .eq('action_type', 'REMOVED_FRIEND');
            
            if (error) throw error;
            setCount(unfriendsCount);
        } catch (err: any) {
            // Fail silently on the client, but log the error for debugging.
            console.error("Failed to fetch unfriend count:", err);
        }
    }, []);

    useEffect(() => {
        fetchCount();

        const channel = supabase
            .channel('public:happenings:unfriend-counter')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'happenings',
                filter: 'action_type=eq.REMOVED_FRIEND'
            }, fetchCount)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchCount]);

    return (
        <div className="bg-secondary/50 p-4 rounded-lg border border-gray-800/60 flex items-center gap-4">
            <div className="bg-red-500/20 text-red-400 p-3 rounded-full">
                <UserMinusIcon className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm text-medium">Total Unfriends (All Time)</p>
                {count === null ? (
                    <div className="h-7 w-20 bg-primary/80 rounded animate-pulse mt-1"></div>
                ) : (
                    <p className="text-2xl font-bold text-light animate-fade-in">{count.toLocaleString()}</p>
                )}
            </div>
        </div>
    );
};

export default UnfriendCounter;
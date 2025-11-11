import { User } from '@supabase/supabase-js';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'removed';

export type HappeningType =
  | 'CREATED_ACCOUNT'
  | 'SENT_FRIEND_REQUEST'
  | 'ACCEPTED_FRIEND_REQUEST'
  | 'REJECTED_FRIEND_REQUEST'
  | 'REMOVED_FRIEND'
  | 'SENT_BEST_FRIEND_REQUEST'
  | 'ADDED_BEST_FRIEND'
  | 'REMOVED_BEST_FRIEND'
  | 'REJECTED_BEST_FRIEND_STATUS'
  | 'FOLLOWED_USER'
  | 'UNFOLLOWED_USER'
  | 'HID_USER'
  | 'UNHID_USER'
  | 'VIEWED_PROFILE';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
  is_banned: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  show_profile_views: boolean;
  last_sign_in_at: string | null;
}

export interface FullUserProfile extends UserProfile {
    is_friend: boolean;
    is_friend_pending_them: boolean;
    is_friend_pending_me: boolean;
    is_following: boolean;
    is_followed_by: boolean;
    is_best_friend: boolean;
    is_best_friend_by: boolean;
    is_hidden: boolean;
}

export interface Friendship {
  id: number;
  user_id_1: string;
  user_id_2: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  user_1_profile: UserProfile;
  user_2_profile: UserProfile;
}

export interface Happening {
  id: number;
  actor_id: string;
  action_type: HappeningType;
  target_id: string | null;
  created_at: string;
  actor: UserProfile;
  target: UserProfile | null;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isDev: boolean;
  isViewOnly: boolean;
  paymentRequired: boolean;
  signOut: () => Promise<void>;
}
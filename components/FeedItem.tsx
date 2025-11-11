import React, { memo } from 'react';
import { Happening, HappeningType } from '../types';
import { Link } from 'react-router-dom';
import {
  UserPlusIcon, UserMinusIcon, CheckCircleIcon, XCircleIcon, HeartIcon,
  NoSymbolIcon, EyeIcon, ArrowPathIcon, UserIcon, RssIcon, WifiIcon
} from '@heroicons/react/24/outline';
import Avatar from './ui/Avatar';

const iconMap: { [key in HappeningType]: { icon: React.ElementType, gradient: string, textColor: string } } = {
  CREATED_ACCOUNT: { icon: UserPlusIcon, gradient: 'from-green-500/30 to-green-500/10', textColor: 'text-green-400' },
  SENT_FRIEND_REQUEST: { icon: UserPlusIcon, gradient: 'from-blue-500/30 to-blue-500/10', textColor: 'text-blue-400' },
  ACCEPTED_FRIEND_REQUEST: { icon: CheckCircleIcon, gradient: 'from-green-500/30 to-green-500/10', textColor: 'text-green-400' },
  REJECTED_FRIEND_REQUEST: { icon: XCircleIcon, gradient: 'from-red-500/30 to-red-500/10', textColor: 'text-red-400' },
  REMOVED_FRIEND: { icon: UserMinusIcon, gradient: 'from-red-500/30 to-red-500/10', textColor: 'text-red-400' },
  SENT_BEST_FRIEND_REQUEST: { icon: HeartIcon, gradient: 'from-blue-500/30 to-blue-500/10', textColor: 'text-blue-400' },
  ADDED_BEST_FRIEND: { icon: HeartIcon, gradient: 'from-pink-500/30 to-pink-500/10', textColor: 'text-pink-400' },
  REMOVED_BEST_FRIEND: { icon: HeartIcon, gradient: 'from-gray-500/30 to-gray-500/10', textColor: 'text-gray-400' },
  REJECTED_BEST_FRIEND_STATUS: { icon: XCircleIcon, gradient: 'from-orange-500/30 to-orange-500/10', textColor: 'text-orange-400' },
  FOLLOWED_USER: { icon: RssIcon, gradient: 'from-teal-500/30 to-teal-500/10', textColor: 'text-teal-400' },
  UNFOLLOWED_USER: { icon: WifiIcon, gradient: 'from-gray-500/30 to-gray-500/10', textColor: 'text-gray-400' },
  HID_USER: { icon: NoSymbolIcon, gradient: 'from-yellow-500/30 to-yellow-500/10', textColor: 'text-yellow-400' },
  UNHID_USER: { icon: ArrowPathIcon, gradient: 'from-yellow-500/30 to-yellow-500/10', textColor: 'text-yellow-300' },
  VIEWED_PROFILE: { icon: EyeIcon, gradient: 'from-purple-500/30 to-purple-500/10', textColor: 'text-purple-400' },
};

const FeedIcon: React.FC<{ action: HappeningType }> = ({ action }) => {
    const { icon: Icon, gradient, textColor } = iconMap[action] || { icon: UserIcon, gradient: 'from-gray-500/30 to-gray-500/10', textColor: 'text-gray-400' };
    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${gradient} ${textColor}`}>
            <Icon className="h-5 w-5" />
        </div>
    );
};

const FeedItem: React.FC<{ happening: Happening }> = ({ happening }) => {
  const { actor, target, action_type, created_at } = happening;

  const renderContent = () => {
    const ActorLink = <Link to={`/profile/${actor.username}`} className="font-semibold text-light hover:underline">{actor.display_name}</Link>;
    const TargetLink = target ? <Link to={`/profile/${target.username}`} className="font-semibold text-light hover:underline">{target.display_name}</Link> : null;

    switch (action_type) {
      case 'CREATED_ACCOUNT':
        return <>{ActorLink} created an account.</>;
      case 'SENT_FRIEND_REQUEST':
        return <>{ActorLink} sent a friend request to {TargetLink}.</>;
      case 'ACCEPTED_FRIEND_REQUEST':
        return <>{ActorLink} accepted a friend request from {TargetLink}.</>;
      case 'REJECTED_FRIEND_REQUEST':
        return <>{ActorLink} rejected a friend request from {TargetLink}.</>;
      case 'REMOVED_FRIEND':
        return <>{ActorLink} removed {TargetLink} as a friend.</>;
      case 'SENT_BEST_FRIEND_REQUEST':
        return <>{ActorLink} sent a best friend request to {TargetLink}.</>;
      case 'ADDED_BEST_FRIEND':
        return <>{ActorLink} added {TargetLink} as a best friend.</>;
      case 'REMOVED_BEST_FRIEND':
        return <>{ActorLink} removed {TargetLink} as a best friend.</>;
      case 'REJECTED_BEST_FRIEND_STATUS':
          return <>{ActorLink} rejected {TargetLink}'s "best friend" status.</>;
      case 'FOLLOWED_USER':
        return <>{ActorLink} started following {TargetLink}.</>;
      case 'UNFOLLOWED_USER':
        return <>{ActorLink} unfollowed {TargetLink}.</>;
      case 'HID_USER':
        return <>{ActorLink} hid {TargetLink} from their feed.</>;
      case 'UNHID_USER':
        return <>{ActorLink} unhid {TargetLink}.</>;
      case 'VIEWED_PROFILE':
        return <>{ActorLink} viewed the profile of {TargetLink}.</>;
      default:
        return <>{actor.display_name} did something.</>;
    }
  };

  return (
    <div className="bg-secondary/50 p-4 rounded-lg border border-gray-800/60 flex items-start gap-4 transition-all duration-200 hover:bg-secondary/80 hover:border-gray-700">
       <FeedIcon action={action_type} />
       <div className="flex-grow min-w-0">
          <div className="text-sm text-medium leading-relaxed">
            {renderContent()}
          </div>
          <span className="text-xs text-medium/70 mt-1 block">
            {new Date(created_at).toLocaleString()}
          </span>
       </div>
       <Link to={`/profile/${actor.username}`} className="shrink-0">
         <Avatar displayName={actor.display_name} imageUrl={actor.avatar_url} size="md" />
       </Link>
    </div>
  );
};

export default memo(FeedItem);
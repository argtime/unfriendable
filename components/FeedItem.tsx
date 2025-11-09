import React from 'react';
import { Happening, HappeningType } from '../types';
import { Link } from 'react-router-dom';
import {
  UserPlusIcon, UserMinusIcon, CheckCircleIcon, XCircleIcon, HeartIcon,
  NoSymbolIcon, EyeIcon, ArrowPathIcon, UserIcon, RssIcon, WifiIcon
} from '@heroicons/react/24/outline';
import Avatar from './ui/Avatar';

const iconMap: { [key in HappeningType]: { icon: React.ElementType, color: string } } = {
  CREATED_ACCOUNT: { icon: UserPlusIcon, color: 'bg-green-500/20 text-green-400' },
  SENT_FRIEND_REQUEST: { icon: UserPlusIcon, color: 'bg-blue-500/20 text-blue-400' },
  ACCEPTED_FRIEND_REQUEST: { icon: CheckCircleIcon, color: 'bg-green-500/20 text-green-400' },
  REJECTED_FRIEND_REQUEST: { icon: XCircleIcon, color: 'bg-red-500/20 text-red-400' },
  REMOVED_FRIEND: { icon: UserMinusIcon, color: 'bg-red-500/20 text-red-500' },
  MADE_BEST_FRIEND: { icon: HeartIcon, color: 'bg-pink-500/20 text-pink-400' },
  REMOVED_BEST_FRIEND: { icon: HeartIcon, color: 'bg-gray-500/20 text-gray-500' },
  REJECTED_BEST_FRIEND_STATUS: { icon: XCircleIcon, color: 'bg-orange-500/20 text-orange-400' },
  FOLLOWED_USER: { icon: RssIcon, color: 'bg-teal-500/20 text-teal-400' },
  UNFOLLOWED_USER: { icon: WifiIcon, color: 'bg-gray-500/20 text-gray-500' },
  HID_USER: { icon: NoSymbolIcon, color: 'bg-yellow-500/20 text-yellow-400' },
  UNHID_USER: { icon: ArrowPathIcon, color: 'bg-yellow-500/20 text-yellow-300' },
  VIEWED_PROFILE: { icon: EyeIcon, color: 'bg-purple-500/20 text-purple-400' },
};

const FeedIcon: React.FC<{ action: HappeningType }> = ({ action }) => {
    const { icon: Icon, color } = iconMap[action] || { icon: UserIcon, color: 'bg-gray-500/20 text-gray-400' };
    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color}`}>
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
      case 'MADE_BEST_FRIEND':
        return <>{ActorLink} made {TargetLink} a best friend.</>;
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
    <div className="bg-secondary p-4 rounded-lg border border-gray-800 flex items-start gap-4 transition-all duration-200 hover:bg-secondary/80 hover:border-gray-700">
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
         <Avatar displayName={actor.display_name} size="md" />
       </Link>
    </div>
  );
};

export default FeedItem;

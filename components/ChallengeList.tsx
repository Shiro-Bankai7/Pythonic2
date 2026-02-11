import React from 'react';
import { Week, Challenge } from '../types';
import { ChallengeIcon, ProjectIcon, ArrowIcon } from './icons';

interface ChallengeListProps {
  weeks: Week[];
  selectedChallengeId: string;
  onSelectChallenge: (challenge: Challenge) => void;
}

const ChallengeItem: React.FC<{
    challenge: Challenge;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ challenge, isSelected, onSelect }) => {
    const Icon = challenge.type === 'project' ? ProjectIcon : ChallengeIcon;
    const baseClasses = "flex items-center w-full text-left p-2 pl-8 text-sm rounded-md border border-transparent transition-colors duration-150";
    const selectedClasses = "bg-blue-600 text-white border-blue-600";
    const hoverClasses = "hover:bg-slate-900 border-slate-700";
    
    return (
        <button
            onClick={onSelect}
            className={`${baseClasses} ${isSelected ? selectedClasses : hoverClasses}`}
        >
            <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
            <span className="flex-grow">{challenge.title}</span>
        </button>
    );
};


const ChallengeList: React.FC<ChallengeListProps> = ({ weeks, selectedChallengeId, onSelectChallenge }) => {
  return (
    <nav className="p-4">
      {weeks.map((week, index) => (
        <details key={week.week} open={index < 2}>
          <summary className="flex items-center justify-between p-2 rounded-lg cursor-pointer border border-transparent hover:border-slate-700 hover:bg-slate-900">
            <div className="flex flex-col">
                <span className="font-bold text-slate-200">Week {week.week}: {week.title}</span>
                <span className="text-xs text-slate-400 mt-1">{week.description}</span>
            </div>
            <ArrowIcon className="arrow w-5 h-5 text-slate-400"/>
          </summary>
          <div className="mt-2 space-y-1">
            {week.challenges.map(challenge => (
                <ChallengeItem
                    key={challenge.id}
                    challenge={challenge}
                    isSelected={challenge.id === selectedChallengeId}
                    onSelect={() => onSelectChallenge(challenge)}
                />
            ))}
          </div>
        </details>
      ))}
    </nav>
  );
};

export default ChallengeList;


import React from 'react';
import { ApplyLevel, EDLIDE_APPLY_LEVELS } from '../../../../common/edlideCodeApplySystem.js';

interface ApplyLevelIndicatorProps {
	applyLevel?: ApplyLevel;
	className?: string;
}

export const ApplyLevelIndicator = ({ applyLevel, className = '' }: ApplyLevelIndicatorProps) => {
	if (!applyLevel) {
		return null;
	}

	const getLevelColor = (level: number) => {
		if (level <= 3) return 'text-green-500'; // Simple matches
		if (level <= 6) return 'text-yellow-500'; // Moderate complexity
		return 'text-orange-500'; // Complex matches
	};

	const getLevelDescription = (level: number) => {
		const levelInfo = EDLIDE_APPLY_LEVELS.find(l => l.level === level);
		return levelInfo?.description || `Level ${level}`;
	};

	return (
		<div className={`flex items-center gap-2 text-xs ${getLevelColor(applyLevel.level)} ${className}`}>
			<span className="font-medium">Edlide Apply Level {applyLevel.level}</span>
			<span className="text-gray-400">-</span>
			<span className="text-gray-300">{getLevelDescription(applyLevel.level)}</span>
		</div>
	);
};

interface ApplyLevelLegendProps {
	className?: string;
}

export const ApplyLevelLegend = ({ className = '' }: ApplyLevelLegendProps) => {
	return (
		<div className={`text-xs space-y-1 ${className}`}>
			<div className="font-medium text-gray-200 mb-2">Edlide 9-Level Apply System:</div>
			{EDLIDE_APPLY_LEVELS.map((level: ApplyLevel) => (
				<div key={level.level} className="flex items-center gap-2">
					<span className={`font-mono w-4 ${
						level.level <= 3 ? 'text-green-500' :
						level.level <= 6 ? 'text-yellow-500' : 'text-orange-500'
					}`}>
						{level.level}
					</span>
					<span className="text-gray-300">{level.name}</span>
					<span className="text-gray-500">-</span>
					<span className="text-gray-400 text-xs">{level.description}</span>
				</div>
			))}
		</div>
	);
};
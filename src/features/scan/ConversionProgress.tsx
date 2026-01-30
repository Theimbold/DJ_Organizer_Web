import React from 'react';
import './ConversionProgress.css';

interface ConversionProgressProps {
    text: string;
    overallPercentage: number;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({ text, overallPercentage }) => {
    return (
        <div className="conversion-progress-container">
            <div className="progress-text">
                <span>{text}</span>
                <span>{Math.round(overallPercentage)}%</span>
            </div>
            <div className="progress-bar-background">
                <div className="progress-bar-foreground" style={{ width: `${overallPercentage}%` }}></div>
            </div>
        </div>
    );
};

export default ConversionProgress;

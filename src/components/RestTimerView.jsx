// src/components/RestTimerView.jsx
import React, { useState, useEffect, useMemo } from 'react';

// Fonction pour convertir "60s" ou "1m30" en secondes
const parseDuration = (durationString) => {
    if (!durationString) return 0;
    let totalSeconds = 0;
    const minutesMatch = durationString.match(/(\d+)m/);
    const secondsMatch = durationString.match(/(\d+)s/);
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1], 10) * 60;
    if (secondsMatch) totalSeconds += parseInt(secondsMatch[1], 10);
    return totalSeconds > 0 ? totalSeconds : parseInt(durationString, 10) || 0;
};


const RestTimerView = ({ duration, onComplete, onSkip, nextExerciseName }) => {
    const totalDuration = useMemo(() => parseDuration(duration), [duration]);
    const [timeLeft, setTimeLeft] = useState(totalDuration);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    const progress = (timeLeft / totalDuration) * 100;
    const circumference = 2 * Math.PI * 45; // Rayon de 45

    return (
        <div className="rest-timer-view">
            <div className="timer-info">
                <h2>Repos</h2>
                <div className="circular-timer">
                    <svg viewBox="0 0 100 100">
                        <circle className="timer-bg" cx="50" cy="50" r="45"></circle>
                        <circle 
                            className="timer-progress" 
                            cx="50" 
                            cy="50" 
                            r="45"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - (progress / 100) * circumference}
                        ></circle>
                    </svg>
                    <span className="timer-text">{timeLeft}</span>
                </div>
            </div>
            <div className="next-exercise-preview">
                <p>À suivre</p>
                <h3>{nextExerciseName}</h3>
            </div>
            <div className="button-group">
                <button className="secondary" onClick={onSkip}>Passer le repos</button>
            </div>
        </div>
    );
};

export default RestTimerView;
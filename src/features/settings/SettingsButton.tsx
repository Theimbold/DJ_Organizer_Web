import React from 'react';
import SettingsIcon from '@mui/icons-material/Settings';

interface SettingsButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ isOpen, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      aria-label={isOpen ? "Close Settings" : "Open Settings"}
      className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200"
    >
      <SettingsIcon />
    </button>
  );
};

export default SettingsButton;

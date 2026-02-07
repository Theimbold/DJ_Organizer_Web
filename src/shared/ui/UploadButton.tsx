// src/shared/ui/Upload-Button.tsx
import React from "react";
import { UploadCloud } from "lucide-react";

interface UploadButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  onClick,
  label = "Track hochladen",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        flex items-center gap-2
        px-5 py-3
        rounded-xl
        bg-blue-600 text-white
        hover:bg-blue-700
        active:bg-blue-800
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      <UploadCloud size={18} />
      {label}
    </button>
  );
};

export default UploadButton;

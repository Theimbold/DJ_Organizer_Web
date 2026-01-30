// src/shared/ui/Upload-Button.tsx
import React from "react";
import { UploadCloud } from "lucide-react"; // Icon

interface UploadButtonProps {
    onClick: () => void;
    label?: string;
    disabled?: boolean;
}

const UploadButton: React.FC<UploadButtonProps> = ({
    onClick,
    label = "Upload",
    disabled = false,
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
className={`            
                flex items-center gap-2 px-4 py-2 
                bg-blue-600 text-white 
                rounded-xl shadow-md 
                hover:bg-blue-700 active:bg-blue-800 
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
            `}
        >
            <UploadCloud size={20} />
            {label}
        </button>
    );
};

export default UploadButton;

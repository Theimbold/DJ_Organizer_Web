import React from 'react';

interface SelectionOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    options: string[];
    onSelect: (option: string) => void;
    title: string;
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ isOpen, onClose, options, onSelect, title }) => {
    if (!isOpen) {
        return null;
    }

    const handleSelectOption = (option: string) => {
        onSelect(option);
        onClose();
    };

    return (
        <div 
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.1)', // Very light transparency
                backdropFilter: 'blur(5px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 100,
            }}
            onClick={onClose} // Close when clicking on the background
        >
            <div 
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    width: '90%',
                    height: '90%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <h3 style={{ textAlign: 'center', padding: '1rem', margin: 0, borderBottom: '1px solid #ccc', color: '#333', flexShrink: 0 }}>{title}</h3>
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0, overflowY: 'auto', flexGrow: 1 }}>
                    {options.map(option => (
                        <li 
                            key={option}
                            onClick={() => handleSelectOption(option)}
                            style={{
                                padding: '1rem 1.5rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                color: '#333',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SelectionOverlay;

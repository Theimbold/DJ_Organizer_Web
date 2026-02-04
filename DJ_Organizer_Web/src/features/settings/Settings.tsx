import React, { useState, useEffect } from 'react';
import { db } from '../../core/db/db';

// Define the type for our settings
interface Setting {
  key: string;
  value: any;
}

export const Settings: React.FC = () => {
  const [finishedRoot, setFinishedRoot] = useState<FileSystemDirectoryHandle | null>(null);
  const [finishedRootName, setFinishedRootName] = useState<string>('Not set');

  useEffect(() => {
    // Load the setting from DB when component mounts
    const loadSetting = async () => {
      const setting = await db.table('settings').get('finishedRoot');
      if (setting) {
        setFinishedRoot(setting.value);
        setFinishedRootName(setting.value.name);
      }
    };
    loadSetting();
  }, []);

  const handleSelectDir = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      
      // Save the handle to the database
      await db.table('settings').put({ key: 'finishedRoot', value: dirHandle });

      setFinishedRoot(dirHandle);
      setFinishedRootName(dirHandle.name);
      alert(`"Finished Tracks" root set to: ${dirHandle.name}`);
    } catch (error) {
      console.error('Error selecting directory:', error);
      alert('Could not select directory. Please ensure you grant permission.');
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', margin: '1rem 0', borderRadius: '8px', backgroundColor: '#4A8E69'}}>
      <h4>Settings</h4>
      <p>
        <strong>"Finished Tracks" Root:</strong> {finishedRootName}
      </p>
      <button onClick={handleSelectDir}>
        Select "Finished Tracks" Root Directory
      </button>
      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
        This is the main folder where your rated and organized tracks will be exported to.
      </p>
    </div>
  );
};

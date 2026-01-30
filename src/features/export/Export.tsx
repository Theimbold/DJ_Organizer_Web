const Export = () => {
  const handleExport = () => {
    console.log('Export button clicked');
    // Logic to be implemented in next steps
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Export Rated Tracks</h2>
      <button
        onClick={handleExport}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Export Files
      </button>
    </div>
  );
};

export default Export;
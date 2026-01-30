function QueryPanel({
  tableName,
  setTableName,
  generatedQuery,
  executeQuery,
  isLoading,
  errorDetails
}) {
  return (
    <div className="query-panel">
      <h3>Query Builder</h3>

      <label>Bourough</label>
      <select
        value={tableName}
        onChange={(e) => setTableName(e.target.value)}
      >
        <option value="Queens">Queens</option>
        <option value="Brooklyn">Brooklyn</option>
      </select>

      <textarea
        value={generatedQuery}
        readOnly
      />

      {errorDetails && (
        <pre className="error-box">{errorDetails.message}</pre>
      )}

      <button onClick={executeQuery} disabled={isLoading}>
        {isLoading ? 'Running...' : 'Execute Query'}
      </button>
    </div>
  );
}

export default QueryPanel;

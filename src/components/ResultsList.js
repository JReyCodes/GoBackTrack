import React, { useState, useMemo } from 'react';

function ResultsList({ results }) {
  const [collapsed, setCollapsed] = useState({});
  const [categorizedAddresses, setCategorizedAddresses] = useState({});
  const [appointmentStatus, setAppointmentStatus] = useState({}); // 'Set' or 'No Set'
  const [notes, setNotes] = useState({}); // Notes for each address
  const [activeFilter, setActiveFilter] = useState(null); // null, 'Windows', 'Roofing', 'Siding', 'gobacks', 'visited', 'set'

  // Group results by street
  const grouped = useMemo(() => {
    const groups = {};

    results.forEach(r => {
      const streetKey =
        r.street_num !== null
          ? `${r.street_num} ${r.street_text}`
          : r.street_text;

      if (!groups[streetKey]) {
        groups[streetKey] = [];
      }

      groups[streetKey].push(r);
    });

    return groups;
  }, [results]);

  const hasBeenVisited = (address) => {
    return categorizedAddresses[address] || appointmentStatus[address];
  };

  // Filter results based on active filter
  const filteredGrouped = useMemo(() => {
    if (!activeFilter) return grouped;

    const filtered = {};
    
    Object.entries(grouped).forEach(([street, records]) => {
      let filteredRecords;
      
      if (activeFilter === 'gobacks') {
        // Show only addresses with categories BUT NO appointment status
        filteredRecords = records.filter(r => 
          categorizedAddresses[r.address] && !appointmentStatus[r.address]
        );
      } else if (activeFilter === 'visited') {
        // Show addresses with either category OR status
        filteredRecords = records.filter(r => hasBeenVisited(r.address));
      } else if (activeFilter === 'set') {
        // Show only addresses with "Set" appointment status
        filteredRecords = records.filter(r => appointmentStatus[r.address] === 'Set');
      } else {
        // Show only addresses with specific category
        filteredRecords = records.filter(r => categorizedAddresses[r.address] === activeFilter);
      }
      
      if (filteredRecords.length > 0) {
        filtered[street] = filteredRecords;
      }
    });
    
    return filtered;
  }, [grouped, activeFilter, categorizedAddresses, appointmentStatus]);

  if (!results || results.length === 0) return null;

  const toggleStreet = (street) => {
    setCollapsed(prev => ({
      ...prev,
      [street]: !prev[street]
    }));
  };

  const handleCategorySelection = (address, category) => {
    setCategorizedAddresses(prev => {
      const current = prev[address];
      // Toggle off if clicking the same category, otherwise set new category
      return {
        ...prev,
        [address]: current === category ? null : category
      };
    });
    
    // TODO: Add your logic here to save to database
    console.log(`Address "${address}" categorized as: ${category || 'cleared'}`);
  };

  const handleAppointmentStatus = (address, status) => {
    setAppointmentStatus(prev => {
      const current = prev[address];
      // Toggle off if clicking the same status, otherwise set new status
      return {
        ...prev,
        [address]: current === status ? null : status
      };
    });
    
    // TODO: Add your logic here to save to database
    console.log(`Address "${address}" appointment status: ${status || 'cleared'}`);
  };

  const handleNoteChange = (address, value) => {
    setNotes(prev => ({
      ...prev,
      [address]: value
    }));
    
    // TODO: Add your logic here to save notes to database
    console.log(`Notes for "${address}": ${value}`);
  };

  const getCategoryStats = () => {
    const stats = {
      Windows: 0,
      Roofing: 0,
      Siding: 0,
      GoBacks: 0,
      Visited: 0,
      Set: 0
    };
    
    // Track visited addresses (any with category OR status)
    const visitedAddresses = new Set();
    
    // Count categories
    Object.entries(categorizedAddresses).forEach(([address, cat]) => {
      stats[cat]++;
      visitedAddresses.add(address);
    });
    
    // Count appointment statuses and add to visited
    Object.entries(appointmentStatus).forEach(([address, status]) => {
      visitedAddresses.add(address);
      if (status === 'Set') {
        stats.Set++;
      }
    });
    
    // Go Backs are addresses with categories BUT NO appointment status
    // (if they have Set or No Set, they're not go backs)
    Object.keys(categorizedAddresses).forEach(address => {
      if (!appointmentStatus[address]) {
        stats.GoBacks++;
      }
    });
    
    // Total visited
    stats.Visited = visitedAddresses.size;
    
    return stats;
  };

  const stats = getCategoryStats();

  const handleFilterClick = (filter) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  const getFilteredCount = () => {
    if (!activeFilter) return results.length;
    return Object.values(filteredGrouped).reduce((sum, records) => sum + records.length, 0);
  };


  return (
    <div className="results-container">
      <div className="results-header">
        <h2>
          {activeFilter ? (
            <>
              Showing {getFilteredCount()} of {results.length} addresses
              <button className="clear-filter-btn" onClick={() => setActiveFilter(null)}>
                ✕ Clear Filter
              </button>
            </>
          ) : (
            `Found ${results.length} addresses`
          )}
        </h2>
        
        {(stats.Visited > 0 || stats.GoBacks > 0) && (
          <div className="stats-summary">
            {stats.Visited > 0 && (
              <span 
                className={`stat-badge visited ${activeFilter === 'visited' ? 'active' : ''}`}
                onClick={() => handleFilterClick('visited')}
              >
                Visited: {stats.Visited}
              </span>
            )}
            {stats.Set > 0 && (
              <span 
                className={`stat-badge set ${activeFilter === 'set' ? 'active' : ''}`}
                onClick={() => handleFilterClick('set')}
              >
                Set: {stats.Set}
              </span>
            )}
            {stats.GoBacks > 0 && (
              <span 
                className={`stat-badge gobacks ${activeFilter === 'gobacks' ? 'active' : ''}`}
                onClick={() => handleFilterClick('gobacks')}
              >
                Go Backs: {stats.GoBacks}
              </span>
            )}
            {stats.Windows > 0 && (
              <span 
                className={`stat-badge windows ${activeFilter === 'Windows' ? 'active' : ''}`}
                onClick={() => handleFilterClick('Windows')}
              >
                Windows: {stats.Windows}
              </span>
            )}
            {stats.Roofing > 0 && (
              <span 
                className={`stat-badge roofing ${activeFilter === 'Roofing' ? 'active' : ''}`}
                onClick={() => handleFilterClick('Roofing')}
              >
                Roofing: {stats.Roofing}
              </span>
            )}
            {stats.Siding > 0 && (
              <span 
                className={`stat-badge siding ${activeFilter === 'Siding' ? 'active' : ''}`}
                onClick={() => handleFilterClick('Siding')}
              >
                Siding: {stats.Siding}
              </span>
            )}
          </div>
        )}
      </div>

      {Object.entries(filteredGrouped).map(([street, records]) => {
        const isCollapsed = collapsed[street];

        return (
          <div key={street} className="street-group">
            {/* STREET HEADER */}
            <div
              className={`street-header ${isCollapsed ? 'collapsed' : ''}`}
              onClick={() => toggleStreet(street)}
            >
              <span className="chevron">
                {isCollapsed ? '▶' : '▼'}
              </span>

              <span className="street-title">
                {street}
              </span>

              <span className="street-count">
                ({records.length})
              </span>
            </div>

            {/* COMPACT MOBILE-FRIENDLY RESULTS */}
            {!isCollapsed && (
              <div className="results-list-mobile">
                {records.map((r, i) => {
                  const category = categorizedAddresses[r.address];
                  const status = appointmentStatus[r.address];
                  const note = notes[r.address] || '';
                  
                  return (
                    <div 
                      key={i} 
                      className={`address-row ${category ? 'has-category' : ''} ${status ? 'has-status' : ''}`}
                    >
                      {/* LEFT: Address & Coordinates */}
                      <div className="address-info">
                        <div className="address-text">
                          {r.house_number} {street}
                        </div>
                        <div className="coords-text">
                          {r.latitude.toFixed(6)}, {r.longitude.toFixed(6)}
                        </div>
                        
                        {/* Status indicators below address on mobile */}
                        {(category || status) && (
                          <div className="status-indicators-mobile">
                            {category && (
                              <span className={`mini-badge ${category.toLowerCase()}`}>
                                {category}
                              </span>
                            )}
                            {status && (
                              <span className={`mini-badge status-${status.toLowerCase().replace(' ', '-')}`}>
                                {status}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* RIGHT: Category Buttons (W/R/S) */}
                      <div className="category-buttons-compact">
                        <button
                          className={`compact-btn windows ${category === 'Windows' ? 'active' : ''}`}
                          onClick={() => handleCategorySelection(r.address, 'Windows')}
                          title="Windows"
                        >
                          W
                        </button>
                        <button
                          className={`compact-btn roofing ${category === 'Roofing' ? 'active' : ''}`}
                          onClick={() => handleCategorySelection(r.address, 'Roofing')}
                          title="Roofing"
                        >
                          R
                        </button>
                        <button
                          className={`compact-btn siding ${category === 'Siding' ? 'active' : ''}`}
                          onClick={() => handleCategorySelection(r.address, 'Siding')}
                          title="Siding"
                        >
                          S
                        </button>
                      </div>

                      {/* BOTTOM: Appointment Status Buttons (Set / No Set) */}
                      <div className="appointment-buttons-compact">
                        <button
                          className={`compact-appt-btn set ${status === 'Set' ? 'active' : ''}`}
                          onClick={() => handleAppointmentStatus(r.address, 'Set')}
                        >
                          ✓ Set
                        </button>
                        <button
                          className={`compact-appt-btn no-set ${status === 'No Set' ? 'active' : ''}`}
                          onClick={() => handleAppointmentStatus(r.address, 'No Set')}
                        >
                          ✕ No Set
                        </button>
                      </div>

                      {/* NOTES SECTION - Always Visible */}
                      <div className="notes-section">
                        <textarea
                          className="notes-textarea"
                          placeholder="Notes..."
                          value={note}
                          onChange={(e) => handleNoteChange(r.address, e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ResultsList;
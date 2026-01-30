import React, { useState, useMemo } from 'react';

function ResultsList({ results }) {
  const [collapsed, setCollapsed] = useState({});
  const [expandedAddresses, setExpandedAddresses] = useState(new Set());
  const [categorizedAddresses, setCategorizedAddresses] = useState({});
  const [appointmentStatus, setAppointmentStatus] = useState({}); // 'Set' or 'No Set'
  const [activeFilter, setActiveFilter] = useState(null); // null, 'all', 'Windows', 'Roofing', 'Siding'

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

  const toggleAddressExpansion = (address) => {
    setExpandedAddresses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(address)) {
        newSet.delete(address);
      } else {
        newSet.add(address);
      }
      return newSet;
    });
  };

  const handleCategorySelection = (address, category) => {
    setCategorizedAddresses(prev => ({
      ...prev,
      [address]: category
    }));
    
    // TODO: Add your logic here to save to database
    console.log(`Address "${address}" categorized as: ${category}`);
  };

  const handleAppointmentStatus = (address, status) => {
    setAppointmentStatus(prev => ({
      ...prev,
      [address]: status
    }));
    
    // TODO: Add your logic here to save to database
    console.log(`Address "${address}" appointment status: ${status}`);
  };

  const clearCategory = (address) => {
    setCategorizedAddresses(prev => {
      const newCat = { ...prev };
      delete newCat[address];
      return newCat;
    });
  };

  const clearAppointmentStatus = (address) => {
    setAppointmentStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[address];
      return newStatus;
    });
  };

  const getCategoryStats = () => {
    const stats = {
      Windows: 0,
      Roofing: 0,
      Siding: 0,
      GoBacks: 0,
      Visited: 0
    };
    
    // Track visited addresses (any with category OR status)
    const visitedAddresses = new Set();
    
    // Count categories
    Object.entries(categorizedAddresses).forEach(([address, cat]) => {
      stats[cat]++;
      visitedAddresses.add(address);
    });
    
    // Count appointment statuses and add to visited
    Object.keys(appointmentStatus).forEach(address => {
      visitedAddresses.add(address);
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

            {/* STREET RESULTS */}
            {!isCollapsed && (
              <div className="results-grid">
                {records.map((r, i) => {
                  const isExpanded = expandedAddresses.has(r.address);
                  const category = categorizedAddresses[r.address];
                  const status = appointmentStatus[r.address];
                  
                  return (
                    <div 
                      key={i} 
                      className={`result-card ${isExpanded ? 'expanded' : ''} ${category ? 'categorized' : ''}`}
                    >
                      <div 
                        className="card-header"
                        onClick={() => toggleAddressExpansion(r.address)}
                      >
                        <span className="expand-icon">
                          {isExpanded ? '−' : '+'}
                        </span>
                        
                        <div className="card-title">
                          <strong>
                            {r.house_number} {street}
                          </strong>

                          <div className={`card-status ${category ? 'has-category' : ''}`}>
                            {category ? (
                              <div className="status-badges">
                                <span className={`category-label ${category.toLowerCase()}`}>
                                  ✓ {category}
                                </span>
                                {status && (
                                  <span className={`status-label ${status.toLowerCase().replace(' ', '-')}`}>
                                    {status === 'Set' ? '✓' : '✕'} {status}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="coords">
                                {r.latitude}, {r.longitude}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="card-expanded-content">
                          <div className="coords-full">
                            <strong>Coordinates:</strong> {r.latitude}, {r.longitude}
                          </div>
                          
                          <div className="category-label-section">
                            <strong>Select Category:</strong>
                          </div>
                          
                          <div className="category-buttons">
                            <button
                              className={`cat-btn windows ${category === 'Windows' ? 'active' : ''}`}
                              onClick={() => handleCategorySelection(r.address, 'Windows')}
                            >
                              {category === 'Windows' ? '✓ ' : ''}Windows
                            </button>
                            <button
                              className={`cat-btn roofing ${category === 'Roofing' ? 'active' : ''}`}
                              onClick={() => handleCategorySelection(r.address, 'Roofing')}
                            >
                              {category === 'Roofing' ? '✓ ' : ''}Roofing
                            </button>
                            <button
                              className={`cat-btn siding ${category === 'Siding' ? 'active' : ''}`}
                              onClick={() => handleCategorySelection(r.address, 'Siding')}
                            >
                              {category === 'Siding' ? '✓ ' : ''}Siding
                            </button>
                          </div>

                          {category && (
                            <button
                              className="clear-category-btn"
                              onClick={() => clearCategory(r.address)}
                            >
                              Clear Category
                            </button>
                          )}

                          <div className="appointment-section">
                            <div className="category-label-section">
                              <strong>Appointment Status:</strong>
                            </div>
                            
                            <div className="appointment-buttons">
                              <button
                                className={`appt-btn set ${status === 'Set' ? 'active' : ''}`}
                                onClick={() => handleAppointmentStatus(r.address, 'Set')}
                              >
                                {status === 'Set' ? '✓ ' : ''}Set
                              </button>
                              <button
                                className={`appt-btn no-set ${status === 'No Set' ? 'active' : ''}`}
                                onClick={() => handleAppointmentStatus(r.address, 'No Set')}
                              >
                                {status === 'No Set' ? '✕ ' : ''}No Set
                              </button>
                            </div>

                            {status && (
                              <button
                                className="clear-status-btn"
                                onClick={() => clearAppointmentStatus(r.address)}
                              >
                                Clear Status
                              </button>
                            )}
                          </div>
                        </div>
                      )}
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
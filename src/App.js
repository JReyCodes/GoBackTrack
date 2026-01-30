import React, { useState } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import DrawingManager from './components/DrawingManager';
import ResultsList from './components/ResultsList';
import './App.css';

function App() {
  const position = { lat: 40.714863, lng: -73.759206 };
  const [results, setResults] = useState([]);

  return (
    <div className="App">
      <h1>The Go Back Tracker</h1>

      <div className="map-container">
        <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={position}
            defaultZoom={15}
            mapId="drawing-map"
            gestureHandling="greedy"
          >
            <DrawingManager setResults={setResults} />
          </Map>
        </APIProvider>
      </div>

      <ResultsList results={results} />
    </div>
  );
}

export default App;

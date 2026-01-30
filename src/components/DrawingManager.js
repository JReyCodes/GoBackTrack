import React, { useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import supabase from '../supabaseClient';
import QueryPanel from './QueryPanel';

function DrawingManager({ setResults }) {
  const map = useMap();
  const drawing = useMapsLibrary('drawing');

  const [coordinates, setCoordinates] = useState(null);
  const [tableName, setTableName] = useState('Queens');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    if (!map || !drawing) return;

    const manager = new drawing.DrawingManager({
      drawingMode: drawing.OverlayType.POLYGON,
      drawingControl: true,
      polygonOptions: {
        editable: true,
        draggable: true
      }
    });

    manager.setMap(map);

    window.google.maps.event.addListener(manager, 'overlaycomplete', (e) => {
      const path = e.overlay.getPath().getArray();
      const points = path.map(p => ({
        lng: p.lng(),
        lat: p.lat()
      }));

      setCoordinates({ type: 'polygon', points });
      setGeneratedQuery(generateQuery(tableName, points));
      manager.setDrawingMode(null);
    });

    return () => manager.setMap(null);
  }, [map, drawing, tableName]);

  const generateQuery = (table, points) => {
    const closed = [...points, points[0]];

    const pgPoints = closed
      .map(p => `ST_MakePoint(${p.lng}, ${p.lat})`)
      .join(',');

    return `
SELECT address, latitude, longitude
FROM "${table}"
WHERE ST_Within(
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
  ST_SetSRID(
    ST_MakePolygon(
      ST_MakeLine(ARRAY[${pgPoints}])
    ),
    4326
  )
)`;
  };

  const executeQuery = async () => {
    if (!coordinates) {
      alert('Please draw a shape first');
      return;
    }

    setIsLoading(true);
    setErrorDetails(null);
    setResults([]);

    const { data, error } = await supabase.rpc(
      'execute_postgis_query',
      { query_text: generatedQuery }
    );

    if (error) {
      setErrorDetails(error);
      setIsLoading(false);
      return;
    }

    // 🔽🔽🔽 YOUR ORIGINAL SORTING LOGIC (UNCHANGED) 🔽🔽🔽
if (data && data.length > 0) {
  const sortedData = data.map(record => {
    // Split address
    const parts = record.address.split(' ');

    // House number (e.g. "89-01")
    const houseNumber = parts[0];

    // Street portion (e.g. "201 STREET")
    const streetFull = parts.slice(1).join(' ');

    // ---- HOUSE NUMBER PARSING ----
    const houseNumParts = houseNumber.split('-');
    const house_num1 = parseInt(houseNumParts[0], 10) || 0;
    const house_num2 = parseInt(houseNumParts[1], 10) || 0;

    // ---- STREET PARSING ----
    // Extract numeric street prefix if it exists
    // "201 STREET" → street_num = 201, street_text = "STREET"
    const streetMatch = streetFull.match(/^(\d+)\s*(.*)$/);

    const street_num = streetMatch ? parseInt(streetMatch[1], 10) : null;
    const street_text = streetMatch ? streetMatch[2] : streetFull;

    return {
      ...record,
      house_number: houseNumber,
      house_num1,
      house_num2,
      street_full: streetFull,
      street_num,
      street_text
    };
  });

  sortedData.sort((a, b) => {
    // 1️⃣ Street number (numeric streets first)
    if (a.street_num !== null && b.street_num !== null) {
      if (a.street_num !== b.street_num) {
        return a.street_num - b.street_num;
      }
    } else if (a.street_num !== null) {
      return -1; // numeric streets before named streets
    } else if (b.street_num !== null) {
      return 1;
    }

    // 2️⃣ Street name text
    const streetTextCompare = a.street_text.localeCompare(b.street_text);
    if (streetTextCompare !== 0) {
      return streetTextCompare;
    }

    // 3️⃣ House number first part
    if (a.house_num1 !== b.house_num1) {
      return a.house_num1 - b.house_num1;
    }

    // 4️⃣ House number second part
    return a.house_num2 - b.house_num2;
  });

  setResults(sortedData);
} else {
  setResults([]);
}

    // 🔼🔼🔼 END SORTING LOGIC 🔼🔼🔼

    setIsLoading(false);
  };

  return (
    <QueryPanel
      tableName={tableName}
      setTableName={setTableName}
      generatedQuery={generatedQuery}
      executeQuery={executeQuery}
      isLoading={isLoading}
      errorDetails={errorDetails}
    />
  );
}

export default DrawingManager;

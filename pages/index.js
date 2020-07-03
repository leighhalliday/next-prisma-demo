import React from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { useQuery, useMutation, queryCache } from "react-query";
import Head from "next/head";
import { Search, Locate, AlertWindow, Header } from "../components";
import mapStyles from "../mapStyles";

const libraries = ["places"];
const mapContainerStyle = {
  height: "100vh",
  width: "100vw",
};
const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};
const center = {
  lat: 43.6532,
  lng: -79.3832,
};

async function fetchSightingsRequest() {
  const response = await fetch("/api/sightings");
  const data = await response.json();
  const { sightings } = data;
  return sightings;
}

async function createSightingRequest(sightingData) {
  const response = await fetch("/api/sightings/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sighting: sightingData }),
  });
  const data = await response.json();
  const { sighting } = data;
  return sighting;
}

function useCreateSighting() {
  return useMutation(createSightingRequest, {
    onMutate: (sightingData) => {
      // 1) cancel queries
      queryCache.cancelQueries("sightings");

      // 2) save snapshot
      const snapshot = queryCache.getQueryData("sightings");

      // 3) optimistically update cache
      queryCache.setQueryData("sightings", (prev) => [
        ...prev,
        {
          id: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          ...sightingData,
        },
      ]);

      // 4) return rollback function which reset cache back to snapshot
      return () => queryCache.setQueryData("sightings", snapshot);
    },
    onError: (error, sightingData, rollback) => rollback(),
    onSettled: () => queryCache.invalidateQueries("sightings"),
  });
}

export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const [selected, setSelected] = React.useState(null);

  const { data: sightings } = useQuery("sightings", fetchSightingsRequest);

  const [createSighting] = useCreateSighting();

  const onMapClick = React.useCallback((e) => {
    createSighting({
      latitude: e.latLng.lat(),
      longitude: e.latLng.lng(),
    });
  }, []);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);
  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);
  }, []);

  if (loadError) return "Error";
  if (!isLoaded) return "Loading map...";

  return (
    <>
      <Head>
        <title>Bears</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <Header />
      <Locate panTo={panTo} />
      <Search panTo={panTo} />

      <GoogleMap
        id="map"
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {Array.isArray(sightings) &&
          sightings.map((sighting) => (
            <Marker
              key={sighting.id}
              position={{ lat: sighting.latitude, lng: sighting.longitude }}
              onClick={() => setSelected(sighting)}
              icon={{
                url: `/bear.svg`,
                origin: new window.google.maps.Point(0, 0),
                anchor: new window.google.maps.Point(15, 15),
                scaledSize: new window.google.maps.Size(30, 30),
              }}
            />
          ))}

        {selected && (
          <AlertWindow selected={selected} close={() => setSelected(null)} />
        )}
      </GoogleMap>
    </>
  );
}

import React from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { useQuery, useMutation, queryCache } from "react-query";
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
  const { sightings } = await response.json();
  return sightings;
}

async function createSightingRequest(sighting) {
  const response = await fetch("/api/sightings/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sighting }),
  });
  const { sighting: newSighting } = await response.json();
  return newSighting;
}

function useCreateSighting() {
  return useMutation(createSightingRequest, {
    onMutate: (newSighting) => {
      queryCache.cancelQueries("sightings");

      const snapshot = queryCache.getQueryData("sightings");

      queryCache.setQueryData("sightings", (previous) => [
        ...previous,
        { ...newSighting, id: new Date().toISOString() },
      ]);

      return () => queryCache.setQueryData("sightings", snapshot);
    },
    onError: (_error, _newSighting, rollback) => rollback(),
    onSettled: () => queryCache.refetchQueries("sightings"),
  });
}

export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const { data: sightings } = useQuery("sightings", fetchSightingsRequest);
  const [mutate] = useCreateSighting();
  const [selected, setSelected] = React.useState(null);
  const onMapClick = React.useCallback((e) => {
    mutate({
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

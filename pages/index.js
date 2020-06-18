import React from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { formatRelative, parseISO } from "date-fns";
import { useQuery, useMutation, queryCache } from "react-query";

import mapStyles from "../mapStyles";
import Search from "../components/Search";
import Locate from "../components/Locate";

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

async function fetchSightings() {
  const response = await fetch("/api/sightings");
  const { sightings } = await response.json();
  return sightings;
}

async function createSighting(sighting) {
  const response = await fetch("/api/sightings/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sighting }),
  });
  const { sighting: newSighting } = await response.json();
  return newSighting;
}

export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyBhJJclc7sbhdI1I6b8IxHIEEXLDgGmLrw",
    libraries,
  });

  const { data: markers, status, error } = useQuery(
    "sightings",
    fetchSightings
  );

  const [mutate] = useMutation(createSighting, {
    onMutate: (newSighting) => {
      queryCache.cancelQueries("sightings");

      const snapshot = queryCache.getQueryData("sightings");

      queryCache.setQueryData("sightings", (previous) => [
        ...previous,
        { ...newSighting, id: new Date().toISOString() },
      ]);

      return () => queryCache.setQueryData("sightings", snapshot);
    },
    onError: (error, newSighting, rollback) => rollback(),
    onSettled: () => queryCache.refetchQueries("sightings"),
  });

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
  if (!isLoaded) return "Loading...";

  return (
    <div>
      <h1>
        Bears{" "}
        <span role="img" aria-label="tent">
          ⛺️
        </span>
      </h1>

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
        {Array.isArray(markers) &&
          markers.map((marker) => (
            <Marker
              key={marker.id}
              position={{ lat: marker.latitude, lng: marker.longitude }}
              onClick={() => {
                setSelected(marker);
              }}
              icon={{
                url: `/bear.svg`,
                origin: new window.google.maps.Point(0, 0),
                anchor: new window.google.maps.Point(15, 15),
                scaledSize: new window.google.maps.Size(30, 30),
              }}
            />
          ))}

        {selected ? (
          <InfoWindow
            position={{ lat: selected.latitude, lng: selected.longitude }}
            onCloseClick={() => {
              setSelected(null);
            }}
          >
            <div>
              <h2>
                <span role="img" aria-label="bear">
                  🐻
                </span>{" "}
                Alert
              </h2>
              <p>
                Spotted{" "}
                {formatRelative(parseISO(selected.createdAt), new Date())}
              </p>
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
    </div>
  );
}

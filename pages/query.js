import React from "react";
import { useQuery, useMutation, queryCache } from "react-query";

async function fetchSightings() {
  const response = await fetch("/api/sightings");
  const { sightings } = await response.json();
  return sightings;
}

async function createSighting(newSighting) {
  const response = await fetch("/api/sightings/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sighting: newSighting }),
  });
  const { sighting } = await response.json();
  return sighting;
}

export default function Query() {
  const { data: sightings, error } = useQuery("sightings", fetchSightings);

  const [mutate] = useMutation(createSighting, {
    xonSuccess: (newSighting) => {
      // queryCache.refetchQueries("sightings");
      queryCache.setQueryData("sightings", (prev) => [...prev, newSighting]);
    },

    onMutate: (newData) => {
      queryCache.cancelQueries("sightings");

      const snapshot = queryCache.getQueryData("sightings");

      queryCache.setQueryData("sightings", (prev) => [
        ...prev,
        { ...newData, id: new Date().toISOString() },
      ]);

      return () => queryCache.setQueryData("sightings", snapshot);
    },
    onError: (error, newData, rollback) => rollback(),
    onSettled: () => queryCache.refetchQueries("sightings"),
  });

  if (error) return <span>Error loading data</span>;
  if (!sightings) return <span>loading...</span>;

  return (
    <div>
      <button
        onClick={() => {
          mutate({
            latitude: Math.random() * 100,
            longitude: Math.random() * -100,
          });
        }}
      >
        add
      </button>
      <ul>
        {sightings.map((sighting) => (
          <li key={sighting.id}>
            {sighting.latitude},{sighting.longitude}
          </li>
        ))}
      </ul>
    </div>
  );
}

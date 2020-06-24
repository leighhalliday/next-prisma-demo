import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const { sighting: sightingData } = req.body;
  const prisma = new PrismaClient({ log: ["query"] });

  try {
    const newSighting = await prisma.sighting.create({
      data: {
        latitude: sightingData.latitude,
        longitude: sightingData.longitude,
      },
    });

    res.status(201);
    res.json({ sighting: newSighting });
  } catch (e) {
    console.error(e.message);
    res.status(500);
    res.json({ error: "Error creating sighting" });
  } finally {
    await prisma.disconnect();
  }
}

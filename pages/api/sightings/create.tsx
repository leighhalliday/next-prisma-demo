import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient({ log: ["query"] });

  try {
    const { sighting: sightingData } = req.body;
    const sighting = await prisma.sighting.create({
      data: {
        latitude: sightingData.latitude,
        longitude: sightingData.longitude,
      },
    });

    res.status(201);
    res.json({ sighting });
  } catch (e) {
    console.error(e);

    res.status(500);
    res.json({ error: "Sorry unable to save sighting to database" });
  } finally {
    await prisma.disconnect();
  }
}

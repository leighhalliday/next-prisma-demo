import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient({ log: ["query"] });

  try {
    const sightings = await prisma.sighting.findMany();

    res.json({
      sightings: sightings,
    });
  } catch (e) {
    res.status(500);
    res.json({ error: "Error loading sightings" });
  } finally {
    await prisma.disconnect();
  }
}

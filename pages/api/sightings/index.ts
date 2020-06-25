import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient({ log: ["query"] });

  try {
    const sightings = await prisma.sighting.findMany();
    res.status(200);
    res.json({ sightings });
  } catch (e) {
    res.status(500);
    res.json({ error: "Unable to fetch sightings" });
  } finally {
    await prisma.disconnect();
  }
}

import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient({ log: ["query"] });

  try {
    await prisma.sighting.deleteMany({});

    res.json({ success: true });
  } catch (e) {
    res.status(500);
    res.json({ error: "Error clearing sightings" });
  } finally {
    await prisma.disconnect();
  }
}

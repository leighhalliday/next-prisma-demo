import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const { sighting } = req.body;
  const prisma = new PrismaClient({ log: ["query"] });

  try {
    const newSighting = await prisma.sighting.create({
      data: {
        latitude: sighting.latitude,
        longitude: sighting.longitude,
      },
    });

    res.json({
      sighting: newSighting,
    });
  } catch (e) {
    res.status(500);
    res.json({ error: "Error creating sighting" });
  } finally {
    await prisma.disconnect();
  }
}

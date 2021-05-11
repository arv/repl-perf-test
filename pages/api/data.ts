import type { NextApiRequest, NextApiResponse } from "next";

import * as fs from "fs/promises";

// const jsonFilePath = ;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    return saveFile(req, res);
  }

  const { default: data } = await import("../../data/data.json");

  res.status(200).json(data);
};

function saveFile(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers["content-type"] !== "application/json") {
    res.statusCode = 500;
    res.json({ error: `Invalid content-type: ${req.headers["content-type"]}` });
    return;
  }

  console.log(fs);
  // await

  res.status(200).end("ok");
}

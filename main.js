import { MongoClient, ServerApiVersion } from "mongodb";
import dayjs from "dayjs";
import crypto from "crypto";
import express from "express";

const uri =
  "mongodb+srv://dagaz:pgpaXORUb7OZWLXk@cluster0.001apax.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const app = express();

app.get("/fetch-data", async (req, res) => {
  const date = dayjs().format("YYYY-MM-DD-HH");

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("api_raffles");
    const collection = db.collection("results");

    const lastEntry = await collection.findOne({}, { sort: { _id: -1 } });

    if (!lastEntry) {
      console.log("No entries found in the collection.");
    } else {
      console.log("Last entry in the collection:", lastEntry.date);
    }

    const results = await fetch("https://appcelmlt.com:6444/resultadostv", {
      headers: {
        tok: "e7f3fe7a42028493652438c8f9766b6d7b849fb2",
        desde: dayjs().format("YYYYMMDD"),
        usu: "pepo",
      },
    });

    console.log(`Fetched data for date: ${date}`);

    const data = await results.json();

    const lastEntryHash = lastEntry
      ? crypto
          .createHash("md5")
          .update(JSON.stringify(lastEntry.results))
          .digest("hex")
      : null;

    const dataHash = crypto
      .createHash("md5")
      .update(JSON.stringify(data))
      .digest("hex");

    if (dataHash !== lastEntryHash) {
      const newEntry = {
        date: date,
        results: data,
      };

      await collection.insertOne(newEntry);
      console.log("New entry inserted with date:", newEntry.date);
      res.status(200).send("Data fetch completed. New data inserted.");
    } else {
      console.log("No new data to insert. The latest entry is up to date.");
      res.status(200).send("Data fetch completed. No new data to insert.");
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("An error occurred while fetching data.");
  } finally {
    await client.close();

    console.log("Connection closed");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

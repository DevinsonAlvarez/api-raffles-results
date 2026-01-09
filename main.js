import { MongoClient, ServerApiVersion } from "mongodb";
import dayjs from "dayjs";
import crypto from "crypto";

const uri =
  "mongodb+srv://dagaz:pgpaXORUb7OZWLXk@cluster0.001apax.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

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

  const res = await fetch("https://appcelmlt.com:6444/resultadostv", {
    headers: {
      tok: "e7f3fe7a42028493652438c8f9766b6d7b849fb2",
      desde: dayjs().format("YYYYMMDD"),
      usu: "pepo",
    },
  });

  console.log(`Fetched data for date: ${date}`);

  const data = await res.json();

  const { _id: _, ...lastEntryData } = lastEntry || {};

  const lastEntryHash = lastEntry
    ? crypto
        .createHash("md5")
        .update(JSON.stringify(lastEntryData.results))
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
  } else {
    console.log("No new data to insert. The latest entry is up to date.");
  }
} finally {
  await client.close();

  console.log("Connection closed");
}

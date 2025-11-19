import { NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  http,
} from "@arkiv-network/sdk";
import { mendoza } from "@arkiv-network/sdk/chains";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { stringToPayload, bytesToString } from "@arkiv-network/sdk/utils";

const PRIVATE_KEY =
  process.env.NEXT_PUBLIC_ARKIV_PRIVATE_KEY ||
  "0x9431df4be868e2ea6fe0453bc5cf5e014e5631142829fd1cf24914b226aa50d0";

// Use globalThis to persist database across Fast Refresh in development
// Always access directly via globalThis to ensure we get the same reference
function getDatabase() {
  if (!globalThis.arkivAssetsDatabase) {
    globalThis.arkivAssetsDatabase = [];
  }
  return globalThis.arkivAssetsDatabase;
}

export async function POST(request) {
  console.log("=".repeat(80));
  console.log("🚀 POST REQUEST RECEIVED - Starting Arkiv entity creation");
  console.log("=".repeat(80));
  try {
    const body = await request.json();
    console.log("Request body received, payload type:", typeof body.payload);
    const {
      payload: payloadText = "Hello, from Arkiv!",
      contentType = "text/plain",
      attributes = [{ key: "type", value: "hello" }],
      expiresIn = 120,
    } = body;

    // 1) Connect your account to Arkiv
    const walletClient = createWalletClient({
      chain: mendoza,
      transport: http("https://mendoza.hoodi.arkiv.network/rpc"),
      account: privateKeyToAccount(PRIVATE_KEY),
    });

    const publicClient = createPublicClient({
      chain: mendoza,
      transport: http("https://mendoza.hoodi.arkiv.network/rpc"),
    });

    // 2) Write one small record on-chain
    const { entityKey, txHash } = await walletClient.createEntity({
      payload: stringToPayload(payloadText),
      contentType,
      attributes,
      expiresIn,
    });

    // 3) Read it back and decode to string
    const entity = await publicClient.getEntity(entityKey);
    const data = bytesToString(entity.payload);

    // 4) Parse the payload if it's JSON and add to database
    const assetsDatabase = getDatabase();
    console.log("📊 Database state BEFORE adding entry:");
    console.log("  - Database length:", assetsDatabase.length);
    console.log(
      "  - Database reference:",
      assetsDatabase === globalThis.arkivAssetsDatabase
        ? "✅ Same"
        : "❌ Different",
    );

    let assetData = null;
    try {
      assetData = JSON.parse(data);
      console.log("✅ Parsed JSON payload successfully");
      // Add metadata for database entry
      const databaseEntry = {
        id: assetsDatabase.length + 1,
        entityKey,
        txHash,
        createdAt: new Date().toISOString(),
        ...assetData,
      };
      console.log("📝 Pushing entry to database...");
      assetsDatabase.push(databaseEntry);
      console.log(
        "✅ Entry pushed! New database length:",
        assetsDatabase.length,
      );
      console.log(
        "✅ globalThis.arkivAssetsDatabase length:",
        globalThis.arkivAssetsDatabase.length,
      );
    } catch {
      console.log("⚠️ Failed to parse as JSON, storing as plain text");
      // If not JSON, store as plain text
      const databaseEntry = {
        id: assetsDatabase.length + 1,
        entityKey,
        txHash,
        createdAt: new Date().toISOString(),
        payload: data,
        contentType,
        attributes,
      };
      assetsDatabase.push(databaseEntry);
      console.log(
        "✅ Entry pushed! New database length:",
        assetsDatabase.length,
      );
    }

    // Log the entire database
    console.log("=".repeat(80));
    console.log("📝 POST REQUEST - Adding to database");
    console.log(
      "📦 ARKIV ASSETS DATABASE - Total entries BEFORE push:",
      assetsDatabase.length,
    );
    console.log("New entry being added:", {
      id: assetsDatabase.length + 1,
      entityKey,
      txHash,
      hasAssetData: !!assetData,
    });
    console.log(
      "Database reference:",
      assetsDatabase === globalThis.arkivAssetsDatabase
        ? "✅ Using globalThis"
        : "❌ Different reference",
    );
    console.log("=".repeat(80));
    console.log(
      "📦 ARKIV ASSETS DATABASE - Total entries AFTER push:",
      assetsDatabase.length,
    );
    console.log("=".repeat(80));
    console.log(JSON.stringify(assetsDatabase, null, 2));
    console.log("=".repeat(80));
    console.log(
      "globalThis.arkivAssetsDatabase length:",
      globalThis.arkivAssetsDatabase?.length,
    );
    console.log("=".repeat(80));

    return NextResponse.json({
      success: true,
      entityKey,
      data,
      txHash,
      databaseSize: assetsDatabase.length,
    });
  } catch (error) {
    console.error("Error creating Arkiv entity:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create entity" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityKey = searchParams.get("entityKey");
    const databaseParam = searchParams.get("database");

    // If database query param is present, return the in-memory database
    if (databaseParam === "true") {
      const assetsDatabase = getDatabase();
      console.log("=".repeat(80));
      console.log("📥 GET DATABASE REQUEST");
      console.log("getDatabase() returned:", assetsDatabase);
      console.log("getDatabase() length:", assetsDatabase?.length);
      console.log(
        "GlobalThis keys with 'arkiv':",
        Object.keys(globalThis).filter((k) => k.includes("arkiv")),
      );
      console.log(
        "globalThis.arkivAssetsDatabase exists:",
        !!globalThis.arkivAssetsDatabase,
      );
      console.log(
        "globalThis.arkivAssetsDatabase type:",
        typeof globalThis.arkivAssetsDatabase,
      );
      console.log(
        "globalThis.arkivAssetsDatabase length:",
        globalThis.arkivAssetsDatabase?.length,
      );
      console.log(
        "globalThis.arkivAssetsDatabase === assetsDatabase:",
        globalThis.arkivAssetsDatabase === assetsDatabase,
      );
      console.log(
        "Database reference match:",
        assetsDatabase === globalThis.arkivAssetsDatabase
          ? "✅ Using globalThis"
          : "❌ Different reference",
      );
      console.log("Total entries:", assetsDatabase.length);
      console.log(
        "Database contents:",
        JSON.stringify(assetsDatabase, null, 2),
      );
      console.log("=".repeat(80));

      return NextResponse.json({
        success: true,
        totalEntries: assetsDatabase.length,
        database: assetsDatabase,
      });
    }

    // If no entityKey, return database summary
    if (!entityKey) {
      const assetsDatabase = getDatabase();
      return NextResponse.json({
        success: true,
        totalEntries: assetsDatabase.length,
        message:
          "Use ?entityKey=<key> to read from Arkiv or ?database=true to get full database",
        database: assetsDatabase,
      });
    }

    const publicClient = createPublicClient({
      chain: mendoza,
      transport: http("https://mendoza.hoodi.arkiv.network/rpc"),
    });

    // Read entity from Arkiv
    const entity = await publicClient.getEntity(entityKey);
    const data = bytesToString(entity.payload);

    return NextResponse.json({
      success: true,
      entityKey,
      data,
      entity,
    });
  } catch (error) {
    console.error("Error reading Arkiv entity:", error);
    return NextResponse.json(
      { error: error.message || "Failed to read entity" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const assetsDatabase = getDatabase();
    const entriesCount = assetsDatabase.length;

    console.log("🗑️ DELETE REQUEST - Clearing entire Arkiv database");
    console.log(`Entries to delete: ${entriesCount}`);

    // Clear the database
    assetsDatabase.length = 0;
    globalThis.arkivAssetsDatabase = [];

    console.log("✅ Arkiv database cleared successfully");
    console.log(`Deleted ${entriesCount} entries`);

    return NextResponse.json({
      success: true,
      message: "Arkiv database cleared successfully",
      deletedEntries: entriesCount,
    });
  } catch (error) {
    console.error("Error deleting Arkiv database:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete database" },
      { status: 500 },
    );
  }
}

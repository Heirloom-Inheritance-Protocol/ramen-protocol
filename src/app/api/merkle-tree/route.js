import { NextResponse } from "next/server";

// Use globalThis to persist database across Fast Refresh in development
// Always access directly via globalThis to ensure we get the same reference
function getMerkleTreeDatabase() {
  if (!globalThis.merkleTreeDatabase) {
    globalThis.merkleTreeDatabase = [];
  }
  return globalThis.merkleTreeDatabase;
}

export async function POST(request) {
  console.log("🚀 POST REQUEST RECEIVED - Starting Merkle Tree data storage");
  try {
    const body = await request.json();
    console.log("Request body received:", body);

    const { groupId, index, identityCommitment, merkleTreeRoot } = body;

    // Validate required fields
    if (
      groupId === undefined ||
      index === undefined ||
      identityCommitment === undefined ||
      merkleTreeRoot === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields. Required: groupId, index, identityCommitment, merkleTreeRoot",
        },
        { status: 400 },
      );
    }

    // Get database
    const merkleTreeDatabase = getMerkleTreeDatabase();
    console.log("📊 Database state BEFORE adding entry:");
    console.log("  - Database length:", merkleTreeDatabase.length);
    console.log(
      "  - Database reference:",
      merkleTreeDatabase === globalThis.merkleTreeDatabase
        ? "✅ Same"
        : "❌ Different",
    );

    // Create merkleTreeData object with exact order
    const merkleTreeData = {
      groupId,
      index,
      identityCommitment,
      merkleTreeRoot,
    };

    console.log("📝 Pushing entry to database...");
    merkleTreeDatabase.push(merkleTreeData);
    console.log(
      "✅ Entry pushed! New database length:",
      merkleTreeDatabase.length,
    );
    console.log(
      "✅ globalThis.merkleTreeDatabase length:",
      globalThis.merkleTreeDatabase.length,
    );

    // Log the entire database
    console.log("📝 POST REQUEST - Adding to database");
    console.log(
      "📦 MERKLE TREE DATABASE - Total entries BEFORE push:",
      merkleTreeDatabase.length - 1,
    );
    console.log("New entry being added:", merkleTreeData);
    console.log(
      "Database reference:",
      merkleTreeDatabase === globalThis.merkleTreeDatabase
        ? "✅ Using globalThis"
        : "❌ Different reference",
    );
    console.log(
      "📦 MERKLE TREE DATABASE - Total entries AFTER push:",
      merkleTreeDatabase.length,
    );
    console.log(JSON.stringify(merkleTreeDatabase, null, 2));

    return NextResponse.json({
      success: true,
      merkleTreeData,
      databaseSize: merkleTreeDatabase.length,
    });
  } catch (error) {
    console.error("Error storing Merkle Tree data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to store merkle tree data" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const index = searchParams.get("index");
    const identityCommitment = searchParams.get("identityCommitment");
    const merkleTreeRoot = searchParams.get("merkleTreeRoot");
    const databaseParam = searchParams.get("database");

    const merkleTreeDatabase = getMerkleTreeDatabase();

    // If database query param is present, return the in-memory database
    if (databaseParam === "true") {
      console.log("📥 GET DATABASE REQUEST");
      console.log("getMerkleTreeDatabase() returned:", merkleTreeDatabase);
      console.log(
        "getMerkleTreeDatabase() length:",
        merkleTreeDatabase?.length,
      );
      console.log(
        "GlobalThis keys with 'merkle':",
        Object.keys(globalThis).filter((k) => k.includes("merkle")),
      );
      console.log(
        "globalThis.merkleTreeDatabase exists:",
        !!globalThis.merkleTreeDatabase,
      );
      console.log(
        "globalThis.merkleTreeDatabase type:",
        typeof globalThis.merkleTreeDatabase,
      );
      console.log(
        "globalThis.merkleTreeDatabase length:",
        globalThis.merkleTreeDatabase?.length,
      );
      console.log(
        "globalThis.merkleTreeDatabase === merkleTreeDatabase:",
        globalThis.merkleTreeDatabase === merkleTreeDatabase,
      );
      console.log(
        "Database reference match:",
        merkleTreeDatabase === globalThis.merkleTreeDatabase
          ? "✅ Using globalThis"
          : "❌ Different reference",
      );
      console.log("Total entries:", merkleTreeDatabase.length);
      console.log(
        "Database contents:",
        JSON.stringify(merkleTreeDatabase, null, 2),
      );

      return NextResponse.json({
        success: true,
        totalEntries: merkleTreeDatabase.length,
        database: merkleTreeDatabase,
      });
    }

    // Filter by groupId
    if (groupId !== null) {
      const entries = merkleTreeDatabase.filter(
        (entry) =>
          entry.groupId === groupId || entry.groupId === Number(groupId),
      );
      return NextResponse.json({
        success: true,
        totalEntries: entries.length,
        data: entries,
      });
    }

    // Filter by index
    if (index !== null) {
      const entry = merkleTreeDatabase.find(
        (entry) => entry.index === Number(index) || entry.index === index,
      );
      if (!entry) {
        return NextResponse.json(
          { error: "Merkle tree entry not found for index: " + index },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        data: entry,
      });
    }

    // Filter by identityCommitment
    if (identityCommitment !== null) {
      const entries = merkleTreeDatabase.filter(
        (entry) => entry.identityCommitment === identityCommitment,
      );
      return NextResponse.json({
        success: true,
        totalEntries: entries.length,
        data: entries,
      });
    }

    // Filter by merkleTreeRoot
    if (merkleTreeRoot !== null) {
      const entries = merkleTreeDatabase.filter(
        (entry) => entry.merkleTreeRoot === merkleTreeRoot,
      );
      return NextResponse.json({
        success: true,
        totalEntries: entries.length,
        data: entries,
      });
    }

    // If no filters, return all entries
    return NextResponse.json({
      success: true,
      totalEntries: merkleTreeDatabase.length,
      message:
        "Use ?groupId=<id>, ?index=<index>, ?identityCommitment=<commitment>, ?merkleTreeRoot=<root>, or ?database=true to filter results",
      database: merkleTreeDatabase,
    });
  } catch (error) {
    console.error("Error reading Merkle Tree data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to read merkle tree data" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const merkleTreeDatabase = getMerkleTreeDatabase();
    const entriesCount = merkleTreeDatabase.length;

    console.log("🗑️ DELETE REQUEST - Clearing entire database");
    console.log(`Entries to delete: ${entriesCount}`);

    // Clear the database
    merkleTreeDatabase.length = 0;
    globalThis.merkleTreeDatabase = [];

    console.log("✅ Database cleared successfully");
    console.log(`Deleted ${entriesCount} entries`);

    return NextResponse.json({
      success: true,
      message: "Database cleared successfully",
      deletedEntries: entriesCount,
    });
  } catch (error) {
    console.error("Error deleting Merkle Tree database:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete database" },
      { status: 500 },
    );
  }
}

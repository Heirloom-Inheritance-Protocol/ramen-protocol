"use client";

export function TestMerkleTreeButton() {
  // Generate mock merkle tree data
  function generateMockData() {
    const randomIndex = Math.floor(Math.random() * 1000);
    const randomGroupId = Math.floor(Math.random() * 100);
    const randomHex = () =>
      "0x" +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");
    return {
      groupId: randomGroupId,
      index: randomIndex,
      identityCommitment: randomHex(),
      merkleTreeRoot: randomHex(),
    };
  }

  async function handlePostMerkleTree() {
    console.log("Testing Merkle Tree API POST...");

    const mockData = generateMockData();
    console.log("📝 Mock data to post:", mockData);

    try {
      const response = await fetch("/api/merkle-tree", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockData),
      });

      const data = await response.json();

      console.log("✅ MERKLE TREE API POST RESPONSE");
      console.log(JSON.stringify(data, null, 2));

      if (data.success) {
        console.log("✅ Merkle tree data stored successfully!");
        console.log("Stored entry:", data.merkleTreeData);
        console.log("Database size:", data.databaseSize);
      } else {
        console.error("❌ Error:", data.error);
      }
    } catch (error) {
      console.error("❌ Failed to call Merkle Tree API:", error);
    }
  }

  async function handleGetDatabase() {
    console.log("Retrieving Merkle Tree database...");

    try {
      const response = await fetch("/api/merkle-tree?database=true", {
        method: "GET",
      });

      const data = await response.json();

      console.log("📦 MERKLE TREE DATABASE RETRIEVED");
      console.log(`Total entries: ${data.totalEntries}`);
      console.log(JSON.stringify(data.database, null, 2));

      if (data.success) {
        console.log("✅ Database retrieved successfully!");
        if (data.totalEntries === 0) {
          console.log("ℹ️ Database is empty. Post some merkle tree data first!");
        }
      } else {
        console.error("❌ Error:", data.error);
      }
    } catch (error) {
      console.error("❌ Failed to retrieve database:", error);
    }
  }

  async function handleGetByIndex() {
    const index = prompt("Enter index to retrieve:");
    if (!index) return;

    console.log(`Retrieving Merkle Tree entry with index: ${index}`);

    try {
      const response = await fetch(`/api/merkle-tree?index=${index}`, {
        method: "GET",
      });

      const data = await response.json();

      console.log("🔍 MERKLE TREE ENTRY BY INDEX");
      console.log(JSON.stringify(data, null, 2));

      if (data.success) {
        console.log("✅ Entry retrieved successfully!");
        console.log("Entry data:", data.data);
      } else {
        console.error("❌ Error:", data.error);
      }
    } catch (error) {
      console.error("❌ Failed to retrieve entry:", error);
    }
  }

  async function handleDeleteDatabase() {
    const confirmed = confirm(
      "Are you sure you want to delete the entire database? This action cannot be undone.",
    );
    if (!confirmed) return;

    console.log("Deleting Merkle Tree database...");

    try {
      const response = await fetch("/api/merkle-tree", {
        method: "DELETE",
      });

      const data = await response.json();

      console.log("🗑️ DELETE DATABASE RESPONSE");
      console.log(JSON.stringify(data, null, 2));

      if (data.success) {
        console.log("✅ Database deleted successfully!");
        console.log(`Deleted ${data.deletedEntries} entries`);
      } else {
        console.error("❌ Error:", data.error);
      }
    } catch (error) {
      console.error("❌ Failed to delete database:", error);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      <button
        onClick={handlePostMerkleTree}
        className="rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
      >
        Post Merkle Tree
      </button>
      <button
        onClick={handleGetDatabase}
        className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
      >
        Get Database
      </button>
      <button
        onClick={handleGetByIndex}
        className="rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"
      >
        Get By Index
      </button>
      <button
        onClick={handleDeleteDatabase}
        className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
      >
        Delete Database
      </button>
    </div>
  );
}

"use client";

export function TestArkivButton() {
  async function handleTest() {
    console.log("Testing Arkiv API...");

    try {
      const response = await fetch("/api/arkiv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: "Test from button click!",
          contentType: "text/plain",
          attributes: [{ key: "type", value: "test" }],
          expiresIn: 120,
        }),
      });

      const data = await response.json();

      console.log("✅ Arkiv API Response:", data);

      if (data.success) {
        console.log("Entity Key:", data.entityKey);
        console.log("Data:", data.data);
        console.log("Transaction Hash:", data.txHash);
      } else {
        console.error("❌ Error:", data.error);
      }
    } catch (error) {
      console.error("❌ Failed to call Arkiv API:", error);
    }
  }

  async function handleRetrieveDatabase() {
    console.log("Retrieving Arkiv database...");

    try {
      const response = await fetch("/api/arkiv?database=true", {
        method: "GET",
      });

      const data = await response.json();

      console.log("=".repeat(80));
      console.log("📦 ARKIV DATABASE RETRIEVED");
      console.log("=".repeat(80));
      console.log(`Total entries: ${data.totalEntries}`);
      console.log("=".repeat(80));
      console.log(JSON.stringify(data.database, null, 2));
      console.log("=".repeat(80));

      if (data.success) {
        console.log("✅ Database retrieved successfully!");
        if (data.totalEntries === 0) {
          console.log("ℹ️ Database is empty. Create some inheritances first!");
        }
      } else {
        console.error("❌ Error:", data.error);
      }
    } catch (error) {
      console.error("❌ Failed to retrieve database:", error);
    }
  }

  async function handleDeleteDatabase() {
    const confirmed = confirm(
      "Are you sure you want to delete the entire Arkiv database? This action cannot be undone.",
    );
    if (!confirmed) return;

    console.log("Deleting Arkiv database...");

    try {
      const response = await fetch("/api/arkiv", {
        method: "DELETE",
      });

      const data = await response.json();

      console.log("🗑️ DELETE ARKIV DATABASE RESPONSE");
      console.log(JSON.stringify(data, null, 2));

      if (data.success) {
        console.log("✅ Arkiv database deleted successfully!");
        console.log(`Deleted ${data.deletedEntries} entries`);
      } else {
        console.error("❌ Error:", data.error);
      }
    } catch (error) {
      console.error("❌ Failed to delete Arkiv database:", error);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <button
        onClick={handleTest}
        className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Test Arkiv API
      </button>
      <button
        onClick={handleRetrieveDatabase}
        className="rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
      >
        Get Database
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

import express from "express";

const router = express.Router();

/**
 * Admin endpoint to view members from Arkiv for a specific vault
 * GET /api/admin/members/:vaultId
 */
router.get("/members/:vaultId", async (req, res) => {
    try {
        const {vaultId} = req.params;
        const vaultIdNum = parseInt(vaultId);

        console.log(`📝 Admin: Retrieving members from Arkiv for vault ${vaultId}`);

        const arkivApiUrl = process.env.ARKIV_API_URL || "http://localhost:3000/api/arkiv";
        const arkivResponse = await fetch(`${arkivApiUrl}?database=true`);

        if (!arkivResponse.ok) {
            throw new Error("Failed to fetch from Arkiv");
        }

        const arkivData = await arkivResponse.json();
        const allEntries = arkivData.database || [];

        // Filter vault member entries for this specific vaultId
        const vaultMembers = allEntries.filter(entry =>
            entry.type === 'vault-member' && entry.vaultId === vaultIdNum
        );

        // Sort by timestamp and extract identity commitments
        const members = vaultMembers
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map(entry => entry.identityCommitment);

        return res.status(200).json({
            success: true,
            vaultId: vaultIdNum,
            memberCount: members.length,
            members: members,
        });
    } catch (error) {
        console.error("❌ Error retrieving members from Arkiv:", error);
        return res.status(500).json({
            error: "Failed to retrieve members from Arkiv",
            message: error.message,
        });
    }
});

/**
 * Admin endpoint to view all members from Arkiv
 * GET /api/admin/members
 */
router.get("/members", async (req, res) => {
    try {
        console.log(`📝 Admin: Retrieving all members from Arkiv`);

        const arkivApiUrl = process.env.ARKIV_API_URL || "http://localhost:3000/api/arkiv";
        const arkivResponse = await fetch(`${arkivApiUrl}?database=true`);

        if (!arkivResponse.ok) {
            throw new Error("Failed to fetch from Arkiv");
        }

        const arkivData = await arkivResponse.json();
        const allEntries = arkivData.database || [];

        // Filter only vault-member entries
        const allVaultMembers = allEntries.filter(entry =>
            entry.type === 'vault-member'
        );

        // Group by vaultId
        const groupedByVault = {};
        allVaultMembers.forEach(entry => {
            if (!groupedByVault[entry.vaultId]) {
                groupedByVault[entry.vaultId] = [];
            }
            groupedByVault[entry.vaultId].push({
                identityCommitment: entry.identityCommitment,
                timestamp: entry.timestamp,
                transactionHash: entry.transactionHash
            });
        });

        return res.status(200).json({
            success: true,
            totalMembers: allVaultMembers.length,
            vaultCount: Object.keys(groupedByVault).length,
            membersByVault: groupedByVault,
        });
    } catch (error) {
        console.error("❌ Error retrieving all members from Arkiv:", error);
        return res.status(500).json({
            error: "Failed to retrieve members from Arkiv",
            message: error.message,
        });
    }
});

export default router;

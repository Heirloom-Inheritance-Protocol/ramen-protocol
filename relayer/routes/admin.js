import express from "express";
import {getIdentityCommitmentsByGroup, getIdentityCommitmentsInOrder} from "../utils/mongodb.js";

const router = express.Router();

/**
 * Admin endpoint to view members from database for a specific vault
 * GET /api/admin/members/:vaultId
 */
router.get("/members/:vaultId", async (req, res) => {
    try {
        const {vaultId} = req.params;
        const vaultIdNum = parseInt(vaultId);

        console.log(`📝 Admin: Retrieving members from database for vault ${vaultId}`);

        const members = await getIdentityCommitmentsByGroup(vaultIdNum);

        return res.status(200).json({
            success: true,
            vaultId: vaultIdNum,
            memberCount: members.length,
            members: members,
        });
    } catch (error) {
        console.error("❌ Error retrieving members from database:", error);
        return res.status(500).json({
            error: "Failed to retrieve members from database",
            message: error.message,
        });
    }
});

/**
 * Admin endpoint to view all members from database
 * GET /api/admin/members
 */
router.get("/members", async (req, res) => {
    try {
        console.log(`📝 Admin: Retrieving all members from database`);

        const members = await getIdentityCommitmentsInOrder();

        return res.status(200).json({
            success: true,
            memberCount: members.length,
            members: members,
        });
    } catch (error) {
        console.error("❌ Error retrieving members from database:", error);
        return res.status(500).json({
            error: "Failed to retrieve members from database",
            message: error.message,
        });
    }
});

export default router;

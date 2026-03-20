const express = require("express");
const router = express.Router();
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");
const {
  getAllPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition
} = require("../controllers/positionController");
const { ROLES } = require("../constants/roles");

// ADMIN, HR, MANAGER - get all positions
router.get("/", verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), getAllPositions);

// ADMIN, HR, MANAGER - get position by ID
router.get("/:id", verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), getPositionById);

// ADMIN, HR - create position
router.post("/", verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR]), createPosition);

// ADMIN, HR - update position
router.put("/:id", verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR]), updatePosition);

// ADMIN, HR - delete position
router.delete("/:id", verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR]), deletePosition);

module.exports = router;

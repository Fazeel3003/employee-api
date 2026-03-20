const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { verifyToken, verifyRole, checkOwnership } = require("../middleware/authMiddleware");
const { ROLES } = require("../constants/roles");

// Apply authentication to all project routes
router.use(verifyToken);

// ADMIN, HR, MANAGER - get project stats
router.get("/count", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), projectController.getProjectCount);
router.get("/active/count", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), projectController.getActiveProjectCount);
router.get("/completed/count", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), projectController.getCompletedProjectsCount);

// ADMIN, HR, MANAGER - get all projects
router.get("/", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), projectController.getAllProjects);

// USER - get own projects only (via employee_projects)
router.get("/me", verifyRole([ROLES.USER]), checkOwnership('id'), projectController.getAllProjects);

// ADMIN, HR, MANAGER - get project by ID
router.get("/:id", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), projectController.getProjectById);

// ADMIN, MANAGER - create project
router.post("/", verifyRole([ROLES.ADMIN, ROLES.MANAGER]), projectController.createProject);

// ADMIN, MANAGER - update project
router.put("/:id", verifyRole([ROLES.ADMIN, ROLES.MANAGER]), projectController.updateProject);

// ADMIN, MANAGER - delete project
router.delete("/:id", verifyRole([ROLES.ADMIN, ROLES.MANAGER]), projectController.deleteProject);

module.exports = router;

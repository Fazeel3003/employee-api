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

// ALL ROLES - get all projects with role-based filtering
router.get("/", (req, res, next) => {
  const role = req.user?.role;
  console.log("Projects route - User role:", role);
  
  // Normalize role for backward compatibility
  const normalizeRole = (role) => {
    if (role === "user") return "employee";
    return role;
  };
  
  const normalizedRole = normalizeRole(role);
  console.log("Projects route - Normalized role:", normalizedRole);
  
  if (normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.HR) return next();
  if (normalizedRole === ROLES.MANAGER) {
    req.filterByManager = true;
    return next();
  }
  if (normalizedRole === ROLES.USER) {
    req.filterByUser = true;
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied',
    role: normalizedRole,
    allowedRoles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.USER]
  });
}, projectController.getAllProjects);

// USER - get own projects only (via employee_projects)
router.get("/me", verifyRole([ROLES.USER]), checkOwnership('id'), projectController.getAllProjects);
router.get("/my/count", verifyRole([ROLES.USER]), projectController.getProjectCount);

// ADMIN, HR, MANAGER - get project by ID
router.get("/:id", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), projectController.getProjectById);

// ADMIN, MANAGER - create project
router.post("/", verifyRole([ROLES.ADMIN, ROLES.MANAGER]), projectController.createProject);

// ADMIN, MANAGER - update project
router.put("/:id", verifyRole([ROLES.ADMIN, ROLES.MANAGER]), projectController.updateProject);

// ADMIN only - delete project
router.delete("/:id", verifyRole([ROLES.ADMIN]), projectController.deleteProject);

module.exports = router;

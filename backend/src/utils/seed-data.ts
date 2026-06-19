import dotenv from "dotenv";
import path from "path";
// Load env before connecting
dotenv.config({ path: path.join(__dirname, "../../.env") });

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { RequirementMasterModel } from "../models/RequirementMaster";
import { KnowledgeNodeModel } from "../models/KnowledgeNode";
import { KnowledgeEdgeModel } from "../models/KnowledgeEdge";
import { TaskModel } from "../models/Task";
import { JournalEntryModel } from "../models/JournalEntry";
import { SOWModel } from "../models/SOW";
import { SOWUpdateModel } from "../models/SOWUpdate";

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Connected successfully. Clearing collections...");

    // Clear old data
    await RequirementMasterModel.deleteMany({});
    await KnowledgeNodeModel.deleteMany({});
    await KnowledgeEdgeModel.deleteMany({});
    await TaskModel.deleteMany({});
    await JournalEntryModel.deleteMany({});
    await SOWModel.deleteMany({});
    await SOWUpdateModel.deleteMany({});
    console.log("Old data cleared.");

    // 1. Seed Requirement Masters (Version-Wise Management Specs)
    console.log("Seeding Requirement Masters...");
    await RequirementMasterModel.create([
      {
        requirementCode: "REQ-DB-ROLES",
        title: "System Access Roles & Permissions Specifications",
        refinedRequirement: "Specifies roles (Super Admin R001, Admin R002, Manager R003, Editor R004, Viewer R005, Guest R006) and system mappings governing write, edit, and deletion privileges.",
        assumptions: ["All user interactions assert one role token parameter"],
        dependencies: [],
        businessRules: ["Super Admin holds unrestricted access", "Guest role is set to is_active: false by default"],
        version: 1,
        status: "approved"
      },
      {
        requirementCode: "REQ-UI-PAGES",
        title: "Application Pages, Sub-pages & Sections Layout",
        refinedRequirement: "Maps page hierarchy from Dashboard P001, Users P002, Reports P005, Settings P007 and their specific widgets/form regions (S001-S008).",
        assumptions: ["Sub-pages render dynamically based on parent page parameters"],
        dependencies: ["REQ-DB-ROLES"],
        businessRules: ["Page sections visibility is toggled by is_visible flag"],
        version: 1,
        status: "approved"
      },
      {
        requirementCode: "REQ-WF-ENG",
        title: "Workflows & Conditional Step Execution Functions",
        refinedRequirement: "Orchestrates background tasks and onboarding pipelines (WF001 Employee Onboarding, WF002 Purchase Approval, WF003 Leave Request, WF005 Password Reset) across functions ST001-ST012.",
        assumptions: ["System tasks execute asynchronously in background queue engines"],
        dependencies: ["REQ-UI-PAGES"],
        businessRules: ["Step execution orders must follow incremental sorting orders"],
        version: 1,
        status: "approved"
      },
      {
        requirementCode: "REQ-API-ROUTES",
        title: "HTTP API Router Endpoints & Security Scopes",
        refinedRequirement: "Configures REST endpoints (API001-API018) for user operations, role listing, page rendering, workflow triggering, and audit log access.",
        assumptions: ["API endpoints authenticate clients via JSON Web Tokens"],
        dependencies: ["REQ-WF-ENG"],
        businessRules: ["Endpoints verify roles_allowed arrays before controller execution"],
        version: 1,
        status: "approved"
      }
    ]);

    // 2. Seed Knowledge Nodes (Roles, Pages, Sections, Workflows, Steps, APIs)
    console.log("Seeding Knowledge Nodes...");
    
    // 2.1 Roles
    const rolesData = [
      { id: "R001", name: "Super Admin", desc: "Full system access" },
      { id: "R002", name: "Admin", desc: "Manage users and content" },
      { id: "R003", name: "Manager", desc: "Approve workflows, view reports" },
      { id: "R004", name: "Editor", desc: "Create and edit content" },
      { id: "R005", name: "Viewer", desc: "Read-only access" },
      { id: "R006", name: "Guest", desc: "Limited public access" }
    ];
    for (const r of rolesData) {
      await KnowledgeNodeModel.create({
        nodeId: `NODE-ROLE-${r.id}`,
        nodeType: "business_rule",
        title: `${r.id}: ${r.name}`,
        content: r.desc,
        priority: r.id === "R001" ? "critical" : "medium",
        domain: "auth",
        module: "Roles"
      });
    }

    // 2.2 Pages
    const pagesData = [
      { id: "P001", name: "Dashboard", route: "/dashboard" },
      { id: "P002", name: "Users", route: "/users" },
      { id: "P003", name: "User List", route: "/users/list" },
      { id: "P004", name: "User Roles", route: "/users/roles" },
      { id: "P005", name: "Reports", route: "/reports" },
      { id: "P006", name: "Sales Report", route: "/reports/sales" },
      { id: "P007", name: "Settings", route: "/settings" },
      { id: "P008", name: "Audit Logs", route: "/settings/audit" }
    ];
    for (const p of pagesData) {
      await KnowledgeNodeModel.create({
        nodeId: `NODE-PAGE-${p.id}`,
        nodeType: "requirement",
        title: `${p.id}: ${p.name}`,
        content: `Route: ${p.route}`,
        priority: "medium",
        domain: "navigation",
        module: "Pages"
      });
    }

    // 2.3 Sections (Widgets)
    const sectionsData = [
      { id: "S001", page: "P001", name: "KPI Cards", type: "widget" },
      { id: "S002", page: "P001", name: "Recent Activity Feed", type: "list" },
      { id: "S003", page: "P001", name: "Revenue Chart", type: "chart" },
      { id: "S004", page: "P002", name: "User Table", type: "table" },
      { id: "S005", page: "P003", name: "Invite User Panel", type: "form" },
      { id: "S006", page: "P005", name: "Date Range Filter", type: "filter" },
      { id: "S007", page: "P006", name: "Export Button", type: "action" },
      { id: "S008", page: "P007", name: "General Settings Form", type: "form" }
    ];
    for (const s of sectionsData) {
      await KnowledgeNodeModel.create({
        nodeId: `NODE-SEC-${s.id}`,
        nodeType: "requirement",
        title: `${s.id}: ${s.name}`,
        content: `Page: ${s.page} | Type: ${s.type}`,
        priority: "low",
        domain: "navigation",
        module: "Sections"
      });
    }

    // 2.4 Workflows
    const workflowsData = [
      { id: "WF001", name: "Employee Onboarding", trigger: "Manual" },
      { id: "WF002", name: "Purchase Approval", trigger: "Form Submit" },
      { id: "WF003", name: "Leave Request", trigger: "Form Submit" },
      { id: "WF004", name: "Invoice Processing", trigger: "Scheduled (daily)" },
      { id: "WF005", name: "Password Reset", trigger: "API Event" },
      { id: "WF006", name: "Report Generation", trigger: "Scheduled (weekly)" }
    ];
    for (const w of workflowsData) {
      await KnowledgeNodeModel.create({
        nodeId: `NODE-WF-${w.id}`,
        nodeType: "decision",
        title: `${w.id}: ${w.name}`,
        content: `Trigger: ${w.trigger}`,
        priority: "high",
        domain: "workflows",
        module: "Pipelines"
      });
    }

    // 2.5 Workflow Steps (Functions)
    const stepsData = [
      { id: "ST001", wf: "WF001", name: "Collect employee details", role: "R003" },
      { id: "ST002", wf: "WF001", name: "IT account provisioning", role: "system" },
      { id: "ST003", wf: "WF001", name: "Manager approval", role: "R003" },
      { id: "ST004", wf: "WF001", name: "Send welcome email", role: "system" },
      { id: "ST005", wf: "WF002", name: "Submit purchase request", role: "R004" },
      { id: "ST006", wf: "WF002", name: "Finance review", role: "R003" },
      { id: "ST007", wf: "WF002", name: "Generate PO", role: "system" },
      { id: "ST008", wf: "WF003", name: "Submit leave form", role: "R005" },
      { id: "ST009", wf: "WF003", name: "Line manager approval", role: "R003" },
      { id: "ST010", wf: "WF003", name: "Update HR calendar", role: "system" },
      { id: "ST011", wf: "WF005", name: "Verify identity", role: "system" },
      { id: "ST012", wf: "WF005", name: "Send reset link", role: "system" }
    ];
    for (const st of stepsData) {
      await KnowledgeNodeModel.create({
        nodeId: `NODE-STEP-${st.id}`,
        nodeType: "task",
        title: `${st.id}: ${st.name}`,
        content: `Workflow: ${st.wf} | Assignee: ${st.role}`,
        priority: "medium",
        domain: "workflows",
        module: "Functions"
      });
    }

    // 2.6 APIs
    const apisData = [
      { id: "API001", method: "GET", path: "/api/users", roles: ["R001", "R002"] },
      { id: "API002", method: "POST", path: "/api/users", roles: ["R001", "R002"] },
      { id: "API003", method: "PUT", path: "/api/users/:id", roles: ["R001", "R002"] },
      { id: "API004", method: "DELETE", path: "/api/users/:id", roles: ["R001"] },
      { id: "API005", method: "GET", path: "/api/roles", roles: ["R001", "R002", "R003"] },
      { id: "API006", method: "POST", path: "/api/roles", roles: ["R001", "R002"] },
      { id: "API007", method: "GET", path: "/api/pages", roles: ["R001", "R002"] },
      { id: "API008", method: "POST", path: "/api/pages", roles: ["R001"] },
      { id: "API009", method: "GET", path: "/api/pages/:id/sections", roles: ["R001", "R002", "R003"] },
      { id: "API010", method: "GET", path: "/api/workflows", roles: ["R001", "R002", "R003"] },
      { id: "API011", method: "POST", path: "/api/workflows", roles: ["R001", "R002"] },
      { id: "API012", method: "POST", path: "/api/workflows/:id/trigger", roles: ["R001", "R002", "R003"] },
      { id: "API013", method: "GET", path: "/api/workflows/:id/steps", roles: ["R001", "R002", "R003"] },
      { id: "API014", method: "POST", path: "/api/auth/login", roles: ["Public"] },
      { id: "API015", method: "POST", path: "/api/auth/logout", roles: ["All"] },
      { id: "API016", method: "POST", path: "/api/auth/reset-password", roles: ["Public"] },
      { id: "API017", method: "GET", path: "/api/reports/sales", roles: ["R001", "R002", "R003"] },
      { id: "API018", method: "GET", path: "/api/audit-logs", roles: ["R001"] }
    ];
    for (const a of apisData) {
      await KnowledgeNodeModel.create({
        nodeId: `NODE-API-${a.id}`,
        nodeType: "requirement",
        title: `${a.id}: ${a.method} ${a.path}`,
        content: `Allowed Roles: ${a.roles.join(", ")}`,
        priority: a.method === "DELETE" ? "critical" : "medium",
        domain: "endpoints",
        module: "Router"
      });
    }
    console.log("Seeded all Knowledge Nodes.");

    // 3. Seed Knowledge Edges (Graph Connections)
    console.log("Seeding Knowledge Edges...");
    const edges = [];

    // 3.1 Connect sub-pages to parent pages
    const subPages = [
      { child: "P003", parent: "P002" },
      { child: "P004", parent: "P002" },
      { child: "P006", parent: "P005" },
      { child: "P008", parent: "P007" }
    ];
    for (const sp of subPages) {
      edges.push({
        sourceNodeId: `NODE-PAGE-${sp.parent}`,
        targetNodeId: `NODE-PAGE-${sp.child}`,
        relationshipType: "depends_on"
      });
    }

    // 3.2 Connect sections to pages
    for (const s of sectionsData) {
      edges.push({
        sourceNodeId: `NODE-PAGE-${s.page}`,
        targetNodeId: `NODE-SEC-${s.id}`,
        relationshipType: "depends_on"
      });
    }

    // 3.3 Connect workflow steps to workflows
    for (const st of stepsData) {
      edges.push({
        sourceNodeId: `NODE-WF-${st.wf}`,
        targetNodeId: `NODE-STEP-${st.id}`,
        relationshipType: "depends_on"
      });
    }

    // 3.4 Connect APIs to workflows/pages
    const apiRelations = [
      { api: "API001", target: "NODE-PAGE-P002", rel: "relates_to" }, // List users relates to Users page
      { api: "API007", target: "NODE-PAGE-P001", rel: "relates_to" }, // Pages relates to Dashboard
      { api: "API010", target: "NODE-WF-WF001", rel: "relates_to" },  // Workflows relates to onboarding
      { api: "API012", target: "NODE-WF-WF002", rel: "generates" },   // Trigger relates to purchase approval
      { api: "API017", target: "NODE-SEC-S007", rel: "implements" }   // Sales report implements Export button
    ];
    for (const ar of apiRelations) {
      edges.push({
        sourceNodeId: `NODE-API-${ar.api}`,
        targetNodeId: ar.target,
        relationshipType: ar.rel
      });
    }

    // 3.5 Connect roles to endpoints/rules
    const rolePermissions = [
      { role: "R001", target: "NODE-API-API004", rel: "depends_on" }, // Admin can delete user
      { role: "R002", target: "NODE-API-API002", rel: "depends_on" }, // Admin can create user
      { role: "R003", target: "NODE-PAGE-P005", rel: "relates_to" },  // Manager relates to Reports
      { role: "R004", target: "NODE-SEC-S005", rel: "relates_to" }    // Editor relates to Invite Panel
    ];
    for (const rp of rolePermissions) {
      edges.push({
        sourceNodeId: `NODE-ROLE-${rp.role}`,
        targetNodeId: rp.target,
        relationshipType: rp.rel
      });
    }

    await KnowledgeEdgeModel.create(edges);
    console.log(`Seeded ${edges.length} Knowledge Edges.`);

    // 4. Seed Journal Entries
    console.log("Seeding Journal Entries...");
    await JournalEntryModel.create([
      {
        content: "API Schema Security rules: R001 holds absolute bypass capabilities on all system CRUD parameters. Default configurations reject guest role access across write controllers.",
        sourceType: "manual",
        classification: "requirement",
        status: "approved",
        priority: "high",
        priorityScore: 80,
        estimatedDevelopmentHours: 5,
        estimatedTestingHours: 2,
        complexityScore: 3,
        versions: [
          {
            versionNumber: 1,
            content: "API Schema Security rules: R001 holds absolute bypass capabilities on all system CRUD parameters. Default configurations reject guest role access across write controllers.",
            title: "Security Token Policies",
            modifiedBy: "admin@brained.ai"
          }
        ]
      }
    ]);

    // 5. Seed Tasks
    console.log("Seeding Tasks...");
    await TaskModel.create([
      {
        title: "Deploy IT account provisioning automated step for WF001",
        description: "Implement code hook in ST002 to automatically invoke external AD server when onboarding is triggered.",
        taskType: "requirement",
        priority: "medium",
        priorityScore: 60,
        status: "pending",
        estimatedHours: 8,
        aiGenerated: true
      },
      {
        title: "Create endpoint delete route /api/users/:id restricting to R001",
        description: "Ensure that DELETE routes are secured with requireAdmin and verifyRole assertions in controllers.",
        taskType: "bug",
        priority: "high",
        priorityScore: 90,
        status: "pending",
        estimatedHours: 4,
        aiGenerated: true
      }
    ]);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
  }
};

seedDatabase();

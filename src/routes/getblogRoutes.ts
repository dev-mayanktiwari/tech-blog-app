import { Hono } from "hono";
const router = new Hono();

import { getBlogById, getBlogInBulk } from "../controllers/public.controller";

router.get("/bulk", getBlogInBulk)
router.get("/:id", getBlogById);

export default router;
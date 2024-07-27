// admin panel
import { Hono } from "hono";
const router = new Hono();

import { postBlog, editBlog, adminSignin } from "../controllers/admin.controller";

router.post("/signin", adminSignin);
router.post("/blog/post", postBlog);
router.put("/blog/edit", editBlog);

export default router;
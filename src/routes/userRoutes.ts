import { Hono } from "hono";
const router = new Hono();

import { signupUser, signinUser } from "../controllers/public.controller";

router.post("/signup", signupUser);
router.post("/signin", signinUser);

export default router;
import { Context, Next } from "hono";
import { verify } from "hono/jwt";

export default async function authMiddleware(c: Context, next: Next) {
  try {
    const jwt = c.req.header("Authorization");
    if (!jwt) {
      return c.json({
        message: "Token not provided"
      }, 401);
    }

    // Extract the token from the "Bearer <token>" format
    const token = jwt.split(" ")[1];
    if (!token) {
      return c.json({
        message: "Token not provided"
      }, 401);
    }

    const secret = c.env.JWT_SECRET;
    const decoded = await verify(token, secret);

    if (!decoded) {
      return c.json({
        error: "Invalid token"
      }, 401);
    }

    // Assuming `decoded` contains a `userId` property
    c.set("userId", decoded.userId);
    c.set("role", decoded.role);
    await next();
  } catch (err: any) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
}
import { Context } from "hono";
import { getPrisma } from "../utils/prismaClient";
import hashPassword from "../utils/encryption";
import { sign } from "hono/jwt";
import { signupInput, signinInput } from "inputschemas";

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
export const signupUser = async (c: Context) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { success, error } = signupInput.safeParse(body);
  if (!success) {
    return c.json(
      {
        message: "Bad inputs",
        error: error.errors,
      },
      400
    );
  }
  const password = body.password;
  const hashedPassword = await hashPassword(password);

  try {
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: body.username,
      },
    });

    if (existingUsername) {
      throw new ConflictError("Username already taken.");
    }

    const existingEmail = await prisma.user.findFirst({
      where: {
        email: body.email,
      },
    });

    if (existingEmail) {
      throw new ConflictError(
        "A user already registered with the given email."
      );
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        username: body.username,
        role: body.role || "USER",
      },
    });

    // Create JWT payload
    const payload = {
      userId: user.id,
      role: user.role,
    };
    console.log(payload);
    // Sign the JWT token
    const secret =
      user.role === "USER" ? c.env.JWT_SECRET : c.env.ADMIN_JWT_SECRET;
    console.log(secret);
    const token = await sign(payload, secret);

    return c.json(
      {
        message: "User Created",
        userId: user.id,
        token: token,
      },
      201
    );
  } catch (error: any) {
    if (error instanceof ConflictError) {
      return c.json(
        {
          error: error.message,
        },
        409
      );
    }
    console.log("Error in creating user", error.message);
    return c.json({ error: "User not created" }, 500);
  }
};

export const signinUser = async (c: Context) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { success, error } = signinInput.safeParse(body);
  if (!success) {
    return c.json(
      {
        message: "Bad inputs",
        error: error.errors,
      },
      400
    );
  }
  const email = body.email;
  const password = body.password;
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
        role: "USER",
      },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const hashedPassword = await hashPassword(password);

    if (hashedPassword === user.password) {
      const payload = {
        userId: user.id,
        role: user.role,
      };

      // Sign the JWT token
      const secret = c.env.JWT_SECRET;
      const token = await sign(payload, secret);

      return c.json(
        {
          message: "Login successful",
          token: token,
        },
        200
      );
    } else {
      return c.json({ error: "Invalid password" }, 401);
    }
  } catch (error: any) {
    console.log("Error in login handle", error.message);
    return c.json({ error: "Login error" }, 500);
  }
};

export const getBlogById = async (c: Context) => {
  const blogId = c.req.param("id");
  const prisma = getPrisma(c.env.DATABASE_URL);

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: blogId,
      },
    });

    if (!post) {
      return c.json(
        {
          message: "Post not found",
        },
        404
      );
    }

    return c.json(
      {
        message: "Post found successfully",
        post: post,
      },
      200
    );
  } catch (error: any) {
    console.log("Error in finding post", error.message);
    return c.json(
      {
        error: "Post not found!",
      },
      500
    );
  }
};

export const getBlogInBulk = async (c: Context) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  try {
    const posts = await prisma.post.findMany({});
    if (!posts) {
      return c.json(
        {
          message: "No posts to fetch",
        },
        404
      );
    }
    return c.json(
      {
        posts: posts,
      },
      201
    );
  } catch (error: any) {
    console.log("Error in fetching post", error.message);
    return c.json(
      {
        error: "Error in fetching posts",
      },
      500
    );
  }
};

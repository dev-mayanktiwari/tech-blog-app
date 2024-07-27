import { Context } from "hono";
import { getPrisma } from "../utils/prismaClient";
import hashPassword from "../utils/encryption";
import { sign } from "hono/jwt";
import { signinInput, createBlogInput, updateBlogInput } from "inputschemas";

export const adminSignin = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { success, error } = signinInput.safeParse(body);
    if (!success) {
      return c.json(
        {
          message: "Bad Inputs",
          error: error.errors,
        },
        400
      );
    }
    const email = body.email;
    const password = body.password;
    const prisma = getPrisma(c.env.DATABASE_URL);
    const user = await prisma.user.findUnique({
      where: {
        email: email,
        role: "ADMIN",
      },
    });
    if (!user) {
      return c.json(
        {
          message: "Invalid credentials",
        },
        401
      );
    }
    const hashedPassword = await hashPassword(password);
    if (hashedPassword === user.password) {
      const payload = {
        userId: user.id,
        role: user.role,
      };
      const secret = c.env.ADMIN_JWT_SECRET;
      const token = await sign(payload, secret);
      return c.json({
        token: token,
      });
    } else {
      return c.json(
        {
          message: "Invalid credentials",
        },
        401
      );
    }
  } catch (error: any) {
    console.log("Error in login admin", error.message);
    return c.json(
      {
        error: "Error in admin login",
      },
      500
    );
  }
};

export const postBlog = async (c: Context) => {
  const userId = c.get("userId");
  const role = c.get("role");
  //console.log(role);
  if (role !== "ADMIN") {
    return c.json(
      {
        message: "User is not an admin",
      },
      403
    ); // Use 403 for forbidden
  }

  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { success, error } = createBlogInput.safeParse(body);
  if (!success) {
    return c.json(
      {
        message: "Bad Inputs",
        error: error.errors,
      },
      400
    );
  }
  try {
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: userId, // Assuming authorId is the field name in your schema
      },
    });

    return c.json(
      {
        message: "Post created successfully",
        id: post.id,
      },
      201
    ); // Use 201 for created
  } catch (error: any) {
    console.log("Error in creating post", error.message);
    return c.json(
      {
        error: "Failed to create post",
      },
      500
    );
  }
};

export const editBlog = async (c: Context) => {
  const userId = c.get("userId");
  const role = c.get("role");

  if (role !== "ADMIN") {
    return c.json(
      {
        message: "User is not an admin",
      },
      403
    ); // Use 403 for forbidden
  }

  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { success, error } = updateBlogInput.safeParse(body);
  if (!success) {
    return c.json(
      {
        message: "Bad Inputs",
        error: error.errors,
      },
      400
    );
  }
  try {
    await prisma.post.update({
      where: {
        id: body.id,
        authorId: userId,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });

    return c.json(
      {
        message: "Post updated successfully",
      },
      200
    ); // Use 200 for successful update
  } catch (error: any) {
    console.log("Error in updating post", error.message);
    return c.json(
      {
        error: "Post not updated",
      },
      500
    ); // Use 500 for internal server error
  }
};

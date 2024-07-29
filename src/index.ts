import { Hono } from 'hono'
import userRoutes from './routes/userRoutes';
import blogRoutes from './routes/getblogRoutes';
import adminRoutes from './routes/adminRoutes'
import authMiddleware from './middlewares/authMIdddleware';
import authAdminMiddleware from './middlewares/authAdminMiddleware';
import { cors } from 'hono/cors';

const app = new Hono<{
    Bindings : {
        DATABASE_URL : string;
        JWT_SECRET : string;
        ADMIN_JWT_SECRET : string;
    },
    Variables : {
        userId : string;
        role : string;
    }
}>();

app.use("/api/*", cors({
    origin : "http://localhost:5173"
}))

app.use("/api/v1/blog/*", authMiddleware);
app.use("/api/v1/admin/blog/*", authAdminMiddleware);

app.route("/api/v1/user", userRoutes);
app.route("/api/v1/blog", blogRoutes);
app.route("/api/v1/admin", adminRoutes);

export default app

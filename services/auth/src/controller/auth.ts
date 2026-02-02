import { sql } from "../db/index.js";
import { controller } from "../types/controller.js";
import { AppError } from "../utils/errorClass.js";
import bcrypt from "bcrypt";

export const registerUserController: controller = async (req, res) => {
  const { name, email, password, phoneNumber, role, bio } = req.body;
  if (!name || !email || !password || !phoneNumber || !role) {
    return new AppError(400, "Please fill all the details.");
  }
  const existingUser =
    await sql`SELECT user_id FROM users WHERE email=${email}`;

  if (existingUser.length) {
    return new AppError(409, "User already Exist.");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  let createdUser;

  if (role === "recruiter") {
    const [user] =
      await sql`INSERT INTO users (name, email, password, phone_number, role) VALUES (${name}, ${email}, ${hashPassword},${phoneNumber}, ${role}) RETURNING 
      user_id ,name,email,phone_number,role,created_at`;

    createdUser = user;
  } else if (role === "jobseeker") {
    const file = req.file;
    const [user] =
      await sql`INSERT INTO users (name, email, password, phone_number, role,bio) VALUES (${name}, ${email}, ${hashPassword},${phoneNumber}, ${role},${bio}) RETURNING
       user_id ,name,email,phone_number,role,created_at ,bio`;
    createdUser = user;
  }

  res.status(200).json({
    data: createdUser,
  });
};

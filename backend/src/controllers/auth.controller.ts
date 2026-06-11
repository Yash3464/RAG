import { Request, Response } from "express";
import { generateToken } from "../utils/auth";

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    let role: "admin" | "employee" | null = null;

    if (email === "admin@brained.ai" && password === "admin123") {
      role = "admin";
    } else if (email === "employee@brained.ai" && password === "employee123") {
      role = "employee";
    }

    if (!role) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken({ email, role });

    return res.json({
      success: true,
      token,
      user: {
        email,
        role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

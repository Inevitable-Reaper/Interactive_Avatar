import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/app/lib/db';
 
export async function POST(request: Request) {
  try {
    const { name, email, phone, username, password } = await request.json();
 
    const exists = await pool.query(
      "SELECT id FROM users WHERE email=$1 OR username=$2",
      [email, username]
    );
 
    if (exists.rows.length > 0) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }
 
    const hashPassword = await bcrypt.hash(password, 10);
 
    await pool.query(
      `INSERT INTO users (name, email, phone, username, password, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, phone, username, hashPassword, "user"]
    );
 
    return NextResponse.json(
      { message: "Registration Successful" },
      { status: 201 }
    );
 
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Server Error" },
      { status: 500 }
    );
  }
}
 
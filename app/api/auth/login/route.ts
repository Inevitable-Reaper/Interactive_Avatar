import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    // Query logic from auth.controller.js
    const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]); //

    if (!user.rows.length) {
      return NextResponse.json({ message: "User not found" }, { status: 400 });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password); //
    
    if (!validPassword) {
      return NextResponse.json({ message: "Invalid Credentials" }, { status: 400 });
    }

    // JWT Token Generate
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    ); //

    // Token ko cookie me set karke bhejo taaki middleware pakad sake
    const response = NextResponse.json({ message: "Login Successful" });
    response.cookies.set('token', token, { httpOnly: true, path: '/' });
    
    return response;

  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
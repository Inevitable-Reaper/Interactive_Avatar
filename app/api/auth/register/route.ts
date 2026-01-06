import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/app/lib/db'; // Step 2 wali file import karo

export async function POST(request: Request) {
  try {
    const { name, email, phone, username, password } = await request.json();
    
    // Logic from your auth.controller.js
    const exists = await pool.query(
      "SELECT id FROM users WHERE email=$1 OR username=$2",
      [email, username]
    ); //

    if (exists.rows.length > 0) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (name, email, phone, username, password, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, phone, username, hashPassword, "user"]
    ); //

    return NextResponse.json({ message: "Registration Successful" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
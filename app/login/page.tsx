'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        // Login success, avatar page par jao
        router.push('/avatar'); 
      } else {
        alert("Invalid Credentials");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    // "auth-page" class background aur centering handle karegi
    <main className="auth-page">
      
      {/* "auth-container" class glassmorphism effect aur card styling degi */}
      <div className="auth-container">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <input 
            type="text"
            placeholder="Username" 
            value={form.username}
            onChange={e => setForm({...form, username: e.target.value})} 
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} 
            required
          />
          <button type="submit">Login</button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link href="/register">Register</Link>
        </div>
      </div>
    </main>
  );
}
'use client';
 
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';
 
export default function Register() {
  const router = useRouter();
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<any>(null);
 
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: ''
  });
 
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
 
  useEffect(() => {
    if (phoneInputRef.current) {
      itiRef.current = intlTelInput(phoneInputRef.current, {
        initialCountry: 'in',
        separateDialCode: true,
        utilsScript:
          'https://cdn.jsdelivr.net/npm/intl-tel-input@17.0.21/build/js/utils.js',
      });
    }
 
    return () => {
      itiRef.current?.destroy();
    };
  }, []);
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
 
 
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }
 
 
    if (!itiRef.current || !itiRef.current.isValidNumber()) {
      const errorCode = itiRef.current?.getValidationError();
      console.log('Phone validation error code:', errorCode);
      alert('Please enter a valid phone number');
      return;
    }
 
    const finalData = {
      ...formData,
      phone: itiRef.current.getNumber(),
    };
 
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });
 
      const data = await res.json();
 
      if (res.ok) {
        alert('Registration Successful! Please login.');
        router.push('/login');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong');
    }
  };
 
  return (
    <main className="auth-page">
      <div className="auth-container">
        <h2>Create Account</h2>
 
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            required
          />
 
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            onChange={handleChange}
            required
          />
 
          <div className="text-black">
            <input
              ref={phoneInputRef}
              type="tel"
              name="phone"
              placeholder="Phone Number"
              required
            />
          </div>
 
          <input
            type="text"
            name="username"
            placeholder="Username"
            onChange={handleChange}
            required
          />
 
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />
 
          <button type="submit">Register</button>
        </form>
 
        <div className="auth-link">
          Already have an account? <Link href="/login">Login</Link>
        </div>
      </div>
    </main>
  );
}
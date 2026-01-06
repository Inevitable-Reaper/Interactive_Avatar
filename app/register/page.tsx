'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css'; // Dropdown ki CSS

export default function Register() {
  const router = useRouter();
  const phoneInputRef = useRef<HTMLInputElement>(null); // Phone input ka reference
  const itiRef = useRef<any>(null); // Plugin instance ka reference

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: ''
  });

  // Phone Dropdown Initialize karna (Jaise register.js me tha)
  // Phone Dropdown Initialize karna
  useEffect(() => {
    if (phoneInputRef.current) {
      itiRef.current = intlTelInput(phoneInputRef.current, {
        initialCountry: "in", // Auto ki jagah direct India 'in' kar do agar geoIpLookup fail ho raha ho
        separateDialCode: true,
        // Yahan maine version update kar diya hai taaki tumhare installed npm package se match kare
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@17.0.21/build/js/utils.js",
      });
    }

    // Cleanup function
    return () => {
      itiRef.current?.destroy();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Phone number validate karo
    if (itiRef.current && !itiRef.current.isValidNumber()) {
      // Error code check karne ke liye console log
      const errorCode = itiRef.current.getValidationError();
      console.log("Validation Error Code:", errorCode); 
      // Error codes: 1 = Invalid Country, 2 = Too Short, 3 = Too Long, 4 = Invalid Number
      
      alert("Please enter a valid phone number (Error Code: " + errorCode + ")");
      return;
    }

    // 2. Full international number nikalo (e.g., +919876543210)
    const fullPhoneNumber = itiRef.current?.getNumber();

    // 3. Data prepare karo
    const finalData = {
      ...formData,
      phone: fullPhoneNumber // Form ka simple number replace karke full code wala number bhejo
    };
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Registration Successful! Please Login.');
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
          
          {/* Phone Input with Ref */}
          <div className="text-black"> 
             {/* Text-black diya kyunki dropdown ke andar text white na ho jaye */}
            <input
              ref={phoneInputRef}
              type="tel"
              name="phone"
              id="phone"
              className="w-full" // Tailwind class width fix karne ke liye
              onChange={handleChange}
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
          
          <button type="submit">Sign Up</button>
        </form>

        <div className="auth-link">
          Already have an account? <Link href="/login">Login</Link>
        </div>
      </div>
    </main>
  );
}
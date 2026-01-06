import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      {/* HERO SECTION */}
      <header className="hero">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <h1>Live Digital Avatar</h1>

          {/* <p>
              A modern authentication platform built with
              <strong>Node.js</strong>, <strong>PostgreSQL</strong> & secure web practices
            </p> 
          */}

          <div className="hero-buttons">
            {/* Update hrefs to Next.js routes (remove .html) */}
            <Link href="/register" className="btn">
              Get Started
            </Link>
            <Link href="/login" className="btn-outline">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* PROJECT INFO */}
      <section className="info">
        <h2>Project Features</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>User Registration & Login</h3>
            <p>Secure account creation and login functionality.</p>
          </div>

          <div className="feature-card">
            <h3>Password Encryption</h3>
            <p>Passwords are safely encrypted using bcrypt hashing.</p>
          </div>

          <div className="feature-card">
            <h3>JWT Authentication</h3>
            <p>Token-based authentication for secure sessions.</p>
          </div>

          <div className="feature-card">
            <h3>Role-Based Authorization</h3>
            <p>Support for user and admin access control.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
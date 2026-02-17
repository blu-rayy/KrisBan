import { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const LoginPage = () => {
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const particlesContainerRef = useRef(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(studentNumber, password);
      // Always navigate to dashboard - modal will handle password change if needed
      navigate('/dashboard');
    } catch (err) {
      // Check if this is a first login requiring password change
      if (err.response?.status === 403 && err.response?.data?.requiresPasswordChange) {
        // This is expected - navigate to dashboard where modal will appear
        navigate('/dashboard');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Particle system setup
  useEffect(() => {
    const particlesContainer = particlesContainerRef.current;
    if (!particlesContainer) return;

    const particleCount = 80;

    // Create initial particles
    for (let i = 0; i < particleCount; i++) {
      createParticle();
    }

    function createParticle() {
      const particle = document.createElement('div');
      particle.className = 'particle';

      // Random size (small)
      const size = Math.random() * 3 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      // Initial position
      resetParticle(particle);

      particlesContainer.appendChild(particle);

      // Animate
      animateParticle(particle);
    }

    function resetParticle(particle) {
      // Random position
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;

      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
      particle.style.opacity = '0';

      return {
        x: posX,
        y: posY
      };
    }

    function animateParticle(particle) {
      // Initial position
      const pos = resetParticle(particle);

      // Random animation properties
      const duration = Math.random() * 10 + 10;
      const delay = Math.random() * 5;

      // Animate with timing
      setTimeout(() => {
        particle.style.transition = `all ${duration}s linear`;
        particle.style.opacity = Math.random() * 0.3 + 0.1;

        // Move in a slight direction
        const moveX = pos.x + (Math.random() * 20 - 10);
        const moveY = pos.y - Math.random() * 30; // Move upwards

        particle.style.left = `${moveX}%`;
        particle.style.top = `${moveY}%`;

        // Reset after animation completes
        setTimeout(() => {
          animateParticle(particle);
        }, duration * 1000);
      }, delay * 1000);
    }

    // Mouse interaction
    const handleMouseMove = (e) => {
      // Create particles at mouse position
      const mouseX = (e.clientX / window.innerWidth) * 100;
      const mouseY = (e.clientY / window.innerHeight) * 100;

      // Create temporary particle
      const particle = document.createElement('div');
      particle.className = 'particle';

      // Small size
      const size = Math.random() * 4 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      // Position at mouse
      particle.style.left = `${mouseX}%`;
      particle.style.top = `${mouseY}%`;
      particle.style.opacity = '0.6';

      particlesContainer.appendChild(particle);

      // Animate outward
      setTimeout(() => {
        particle.style.transition = 'all 2s ease-out';
        particle.style.left = `${mouseX + (Math.random() * 10 - 5)}%`;
        particle.style.top = `${mouseY + (Math.random() * 10 - 5)}%`;
        particle.style.opacity = '0';

        // Remove after animation
        setTimeout(() => {
          particle.remove();
        }, 2000);
      }, 10);

      // Subtle movement of gradient spheres
      const spheres = document.querySelectorAll('.gradient-sphere');
      const moveX = (e.clientX / window.innerWidth - 0.5) * 10;
      const moveY = (e.clientY / window.innerHeight - 0.5) * 10;

      spheres.forEach((sphere, index) => {
        sphere.style.transform = `translate(${moveX * (index + 1) * 0.3}px, ${moveY * (index + 1) * 0.3}px)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const particleStyles = `
    .particle {
      position: absolute;
      background: radial-gradient(circle, #15803d 0%, #064e3b 100%);
      border-radius: 50%;
      pointer-events: none;
      box-shadow: 0 0 6px rgba(21, 128, 61, 0.8);
    }
    .particle:hover {
      box-shadow: 0 0 12px rgba(21, 128, 61, 1);
    }
    .gradient-sphere {
      position: absolute;
      border-radius: 50%;
      filter: blur(40px);
      transition: transform 0.3s ease-out;
    }
    .sphere-1 {
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(21, 128, 61, 0.3) 0%, transparent 70%);
      top: 10%;
      left: 10%;
    }
    .sphere-2 {
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(6, 78, 59, 0.25) 0%, transparent 70%);
      top: 60%;
      right: 10%;
    }
    .sphere-3 {
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(2, 44, 34, 0.2) 0%, transparent 70%);
      bottom: 10%;
      left: 50%;
      transform: translateX(-50%);
    }
  `;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      <style>{particleStyles}</style>

      {/* Particles Container */}
      <div
        ref={particlesContainerRef}
        id="particles-container"
        className="absolute inset-0 pointer-events-none"
      />

      {/* Gradient Spheres */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="gradient-sphere sphere-1" />
        <div className="gradient-sphere sphere-2" />
        <div className="gradient-sphere sphere-3" />
      </div>

      {/* Login Card */}
      <div className="bg-surface-main rounded-xl shadow-card-elevated p-8 w-full max-w-md border border-gray-200 relative z-10">
        <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
          KrisBan
        </h1>
        <p className="text-gray-600 mb-8">All-in-One Thesis Management Application</p>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-dark-charcoal font-semibold mb-2">Student Number</label>
            <input
              type="text"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition bg-white"
              placeholder="Enter your student number"
            />
          </div>

          <div>
            <label className="block text-dark-charcoal font-semibold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition bg-white"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-action hover:opacity-90 disabled:opacity-60 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

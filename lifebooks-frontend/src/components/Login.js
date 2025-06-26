import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Corrected API endpoint to include /api
      const response = await axios.post('/api/login', { email, password });
      setMessage(response.data.message);
      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        onLogin(response.data.user); // Pass user data to parent component
        navigate('/dashboard'); // Redirect to dashboard on successful login
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {message && <p className="message">{message}</p>}
      <p>Don't have an account? <a href="/register">Register here</a></p>
      <p><a href="/forgot-password">Forgot password?</a></p>
    </div>
  );
};

export default Login;

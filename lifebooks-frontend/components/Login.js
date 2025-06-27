import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const response = await axios.post('https://lifebooks-ai-backend.onrender.com/api/login', {
                email,
                password
            });

            console.log('Login API response received:', response.data); // LOG 1

            if (response.data.token) {
                console.log('Token received, attempting to store and redirect...'); // LOG 2
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setMessage('Login successful! Redirecting...');

                setTimeout(() => {
                    console.log('Attempting navigation to /dashboard'); // LOG 3
                    navigate('/dashboard');
                }, 1000);
            } else {
                console.log('No token in response, handling as failed login.'); // LOG 4
                setMessage('Login failed: No token received.');
            }
        } catch (error) {
            console.error('Login error:', error.response?.data?.message || error.message); // LOG 5
            setMessage(error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    // ... rest of your component
};

export default Login;


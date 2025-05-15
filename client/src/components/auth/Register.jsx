import { useState, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const Register = () => {
    const { isAuthenticated, setUser, setIsAuthenticated } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password2: ''
    });

    const [error, setError] = useState('');

    const { name, email, password, password2 } = formData;

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }; const onSubmit = async e => {
        e.preventDefault();

        // Validate passwords match
        if (password !== password2) {
            setError('Passwords do not match');
            return;
        }

        try {
            // Configure axios to send cookies with request
            axios.defaults.withCredentials = true;

            const res = await axios.post('/users/register', {
                name,
                email,
                password
            });

            // Set user and auth state directly from response
            setUser(res.data.user);
            setIsAuthenticated(true);

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            console.error('Registration error:', err.response?.data);
        }
    };

    // Google OAuth registration
    const handleGoogleSignup = () => {
        window.location.href = 'http://localhost:5000/api/users/auth/google';
    };

    // Redirect if authenticated
    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <section className="container">
            <h1>Sign Up</h1>
            <p>Create Your Account</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Name"
                        name="name"
                        value={name}
                        onChange={onChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="email"
                        placeholder="Email Address"
                        name="email"
                        value={email}
                        onChange={onChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="Password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        minLength="6"
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        name="password2"
                        value={password2}
                        onChange={onChange}
                        minLength="6"
                        required
                    />
                </div>                <input type="submit" className="btn btn-primary" value="Register" />
            </form>

            <div className="oauth-section" style={{ marginTop: '20px' }}>
                <button
                    onClick={handleGoogleSignup}
                    className="btn btn-danger"
                    style={{ width: '100%' }}
                >
                    Register with Google
                </button>
            </div>

            <p className="my-1">
                Already have an account? <Link to="/login">Sign In</Link>
            </p>
        </section>
    );
};

export default Register; 
import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import InvitationBadge from './InvitationBadge';

const Navbar = () => {
    const { isAuthenticated, setUser, setIsAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate(); const handleLogout = async () => {
        try {
            // Configure axios to send cookies with request
            axios.defaults.withCredentials = true;

            // Call the server logout endpoint
            await axios.get('/users/logout');

            // Clear user data
            setUser(null);
            setIsAuthenticated(false);

            // Redirect to login
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    }; const authLinks = (
        <ul>
            <li>
                <Link to="/dashboard">
                    Dashboard
                    <InvitationBadge />
                </Link>
            </li>
            <li>
                <a href="#!" onClick={handleLogout}>
                    Logout
                </a>
            </li>
        </ul>
    );

    const guestLinks = (
        <ul>
            <li>
                <Link to="/register">Register</Link>
            </li>
            <li>
                <Link to="/login">Login</Link>
            </li>
        </ul>
    );

    return (
        <nav className="navbar">
            <h1>
                <Link to="/">
                    <i className="fas fa-money-bill-wave"></i> ExpenseShare
                </Link>
            </h1>
            <div className="navbar-links">
                {isAuthenticated ? authLinks : guestLinks}
            </div>
        </nav>
    );
};

export default Navbar; 
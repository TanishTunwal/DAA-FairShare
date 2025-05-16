import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const InvitationBadge = () => {
    const [count, setCount] = useState(0);
    const { socket } = useContext(AuthContext);

    useEffect(() => {
        const fetchInvitationsCount = async () => {
            try {
                const res = await axios.get('/groups/invitations');
                setCount(res.data.length);
            } catch (err) {
                console.error('Error fetching invitations count:', err);
            }
        };

        fetchInvitationsCount();

        // Listen for new invitations
        if (socket) {
            socket.on('group_invitation', () => {
                setCount(prevCount => prevCount + 1);
            });
        }

        return () => {
            if (socket) {
                socket.off('group_invitation');
            }
        };
    }, [socket]);

    if (count === 0) {
        return null;
    }

    return (
        <span
            className="invitation-badge"
            style={{
                background: '#ff5252',
                color: 'white',
                borderRadius: '50%',
                padding: '0.15rem 0.5rem',
                fontSize: '0.75rem',
                marginLeft: '0.5rem',
                fontWeight: 'bold'
            }}
        >
            {count}
        </span>
    );
};

export default InvitationBadge;
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const GroupInvitations = ({ onInvitationResponded }) => {
    const { socket } = useContext(AuthContext);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); useEffect(() => {
        const fetchInvitations = async () => {
            try {
                const res = await axios.get('/groups/invitations');
                setInvitations(res.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load invitations');
                console.error('Error fetching invitations:', err);
                setLoading(false);
            }
        };

        fetchInvitations();
    }, []);

    // Listen for real-time invitation updates
    useEffect(() => {
        if (socket) {
            // Handle new invitations
            socket.on('group_invitation', (data) => {
                console.log('New invitation received:', data);
                setInvitations(prev => [data.invitation, ...prev]);

                // Show browser notification if supported
                if ('Notification' in window) {
                    if (Notification.permission === 'granted') {
                        new Notification('New Group Invitation', {
                            body: data.message
                        });
                    } else if (Notification.permission !== 'denied') {
                        Notification.requestPermission().then(permission => {
                            if (permission === 'granted') {
                                new Notification('New Group Invitation', {
                                    body: data.message
                                });
                            }
                        });
                    }
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('group_invitation');
            }
        };
    }, [socket]);

    const handleResponse = async (invitationId, accept) => {
        try {
            await axios.post('/groups/invitations/respond', {
                invitationId,
                accept
            });

            // Update the invitations list by removing the responded invitation
            setInvitations(invitations.filter(inv => inv._id !== invitationId));

            // Notify parent component
            if (onInvitationResponded) {
                onInvitationResponded(accept);
            }
        } catch (err) {
            setError('Failed to respond to invitation');
            console.error('Error responding to invitation:', err);
        }
    };

    if (loading) {
        return <div className="invitations-loading">Loading invitations...</div>;
    }

    if (error) {
        return <div className="invitations-error">{error}</div>;
    } if (invitations.length === 0) {
        return null;
    }

    return (
        <div className="group-invitations">
            <h2>Group Invitations</h2>
            <p className="lead">You have {invitations.length} pending invitation(s)</p>
            <div className="invitations-list"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                {invitations.map(invitation => (
                    <div key={invitation._id} className="invitation-card">
                        <div className="invitation-content">
                            <h3>{invitation.groupName}</h3>
                            <p>You've been invited by {invitation.inviterName}</p>
                            <p className="invitation-date">
                                Sent {new Date(invitation.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="invitation-actions">
                            <button
                                className="btn btn-success"
                                onClick={() => handleResponse(invitation._id, true)}
                            >
                                Accept
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleResponse(invitation._id, false)}
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GroupInvitations;

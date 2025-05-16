import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const GroupDetail = () => {
    const { id } = useParams();
    const { user, socket } = useContext(AuthContext); const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');

    // Fetch group details and expenses
    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                // Get group details
                const groupRes = await axios.get(`/groups/${id}`);
                setGroup(groupRes.data);

                // Get group expenses
                const expensesRes = await axios.get(`/expenses/group/${id}`);
                setExpenses(expensesRes.data);

                setLoading(false);
            } catch (err) {
                setError('Error fetching group data');
                console.error('Error fetching group data:', err);
                setLoading(false);
            }
        };

        fetchGroupData();
    }, [id]);    // Join socket room for this group
    useEffect(() => {
        if (socket && group) {
            socket.emit('join_group', id);

            // Listen for new expenses
            socket.on('expense_added', (data) => {
                setExpenses(prevExpenses => [...prevExpenses, data.expense]);
            });

            // Listen for settlement updates
            socket.on('settlement_update', (data) => {
                setExpenses(prevExpenses =>
                    prevExpenses.map(expense =>
                        expense._id === data.expenseId ? data.expense : expense
                    )
                );
            });

            // Listen for expense deletions
            socket.on('expense_deleted', (data) => {
                setExpenses(prevExpenses =>
                    prevExpenses.filter(expense => expense._id !== data.expenseId)
                );
            });            // Listen for member removals
            socket.on('member_removed', (data) => {
                if (data.groupId === id) {
                    setGroup(prevGroup => ({
                        ...prevGroup,
                        members: prevGroup.members.filter(member => member.user !== data.userId)
                    }));
                }
            });

            // Listen for members leaving
            socket.on('member_left', (data) => {
                if (data.groupId === id) {
                    setGroup(prevGroup => ({
                        ...prevGroup,
                        members: prevGroup.members.filter(member => member.user !== data.userId)
                    }));
                    setSuccess(`${data.userName} has left the group`);
                    // Clear success message after 3 seconds
                    setTimeout(() => {
                        setSuccess('');
                    }, 3000);
                }
            });

            // Listen for invitation responses
            socket.on('invitation_responded', (data) => {
                if (data.groupId === id) {
                    if (data.type === 'accepted') {
                        // Show success message
                        setSuccess(`${data.user.name} (${data.user.email}) has accepted the invitation`);

                        // Add the user to members list in UI
                        if (group && group.members) {
                            setGroup(prevGroup => ({
                                ...prevGroup,
                                members: [...prevGroup.members, {
                                    user: data.user.id,
                                    name: data.user.name,
                                    email: data.user.email
                                }]
                            }));
                        }
                    } else {
                        // Show declined message
                        setError(`${data.email} has declined the invitation`);
                    }

                    // Clear messages after a few seconds
                    setTimeout(() => {
                        setSuccess('');
                        setError('');
                    }, 5000);
                }
            });
        } return () => {
            if (socket) {
                socket.emit('leave_group', id);
                socket.off('expense_added');
                socket.off('settlement_update');
                socket.off('expense_deleted');
                socket.off('member_removed');
                socket.off('member_left');
                socket.off('invitation_responded');
            }
        };
    }, [socket, id, group]); const handleAddMember = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post(`/groups/${id}/members`, { email: newMemberEmail });
            // Show success message
            setSuccess(res.data.message || 'Invitation sent successfully');
            // Clear the input
            setNewMemberEmail('');
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess('');
            }, 3000);
        } catch (err) {
            setError(err.response.data.message || 'Failed to add member');
            console.error('Error adding member:', err.response.data);
            // Clear error message after 3 seconds
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    }; const handleRemoveMember = async (userId, memberName) => {
        try {
            if (window.confirm(
                `Are you sure you want to remove ${memberName} from this group?\n\n` +
                '• They will lose access to all group expenses and settlements\n' +
                '• Their existing expenses in the group will remain\n' +
                '• You can invite them back later if needed'
            )) {
                await axios.delete(`/groups/${id}/members/${userId}`);
                // Update the group state immediately
                setGroup(prevGroup => ({
                    ...prevGroup,
                    members: prevGroup.members.filter(member => member.user !== userId)
                }));
                // Emit socket event for real-time update
                if (socket) {
                    socket.emit('member_removed', {
                        groupId: id,
                        userId: userId
                    });
                }
            }
        } catch (err) {
            setError('Failed to remove member');
            console.error('Error removing member:', err);
        }
    }; const handleLeaveGroup = async () => {
        try {
            if (window.confirm(
                'Are you sure you want to leave this group?\n\n' +
                '• You will lose access to all group expenses and settlements\n' +
                '• You will need to be invited back by the group creator to rejoin\n' +
                '• Your existing expenses in the group will remain'
            )) {
                await axios.post(`/groups/${id}/leave`);
                // No need to emit a socket event here as the server already does that
                // Redirect to dashboard after leaving
                window.location.href = '/dashboard';
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to leave group');
            console.error('Error leaving group:', err);
            // Clear error message after 3 seconds
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    if (loading) {
        return <div className="container">Loading...</div>;
    }

    if (!group) {
        return <div className="container">Group not found</div>;
    }

    return (
        <section className="container">
            <Link to="/dashboard" className="btn btn-light">
                Back to Dashboard
            </Link>            <div className="group-header">
                <h1>{group.name}</h1>
                <p>{group.description}</p>            </div>

            {error && (
                <div className="alert alert-danger" style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000,
                    padding: '1rem',
                    borderRadius: '5px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success" style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000,
                    padding: '1rem',
                    borderRadius: '5px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    {success}
                </div>
            )}            <div className="group-actions">
                <Link to={`/expenses/add/${id}`} className="btn btn-primary">
                    Add Expense
                </Link>
                <Link to={`/expenses/settlement/${id}`} className="btn btn-success">
                    View Settlement Plan
                </Link>
                <Link to={`/expenses/analysis/${id}`} className="btn btn-info">
                    View Expense Analysis
                </Link>                {group.createdBy === user._id ? (
                    <button
                        className="btn btn-danger"
                        onClick={() => {
                            if (window.confirm(
                                'Are you sure you want to delete this group?\n\n' +
                                '• All group expenses and settlements will be permanently deleted\n' +
                                '• All members will lose access to this group\n' +
                                '• This action CANNOT be undone'
                            )) {
                                const handleDeleteGroup = async () => {
                                    try {
                                        await axios.delete(`/groups/${id}`);
                                        window.location.href = "/dashboard";
                                    } catch (err) {
                                        setError('Failed to delete group');
                                        console.error('Error deleting group:', err);
                                    }
                                };
                                handleDeleteGroup();
                            }
                        }}
                    >
                        Delete Group
                    </button>
                ) : (
                    <button className="btn btn-warning" onClick={handleLeaveGroup}>
                        Leave Group
                    </button>
                )}
            </div>

            <div className="group-content">
                <div className="members-section">
                    <h2>Members</h2>
                    <ul className="members-list">
                        {group.members.map(member => (<li key={member.user} className="member-item">
                            <div className="member-info">
                                <span className="member-name">{member.name}</span>
                                {member.user === group.createdBy && (
                                    <span className="creator-badge" style={{
                                        marginLeft: '8px',
                                        fontSize: '0.8rem',
                                        padding: '2px 6px',
                                        backgroundColor: '#4CAF50',
                                        color: 'white',
                                        borderRadius: '4px'
                                    }}>Creator</span>
                                )}
                                {member.user === user._id && member.user !== group.createdBy && (
                                    <span className="you-badge" style={{
                                        marginLeft: '8px',
                                        fontSize: '0.8rem',
                                        padding: '2px 6px',
                                        backgroundColor: '#2196F3',
                                        color: 'white',
                                        borderRadius: '4px'
                                    }}>You</span>
                                )}
                            </div>{group.createdBy === user._id && member.user !== user._id && (
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleRemoveMember(member.user, member.name)}
                                >
                                    Remove
                                </button>
                            )}
                        </li>
                        ))}
                    </ul>

                    {/* Add member form */}
                    <form onSubmit={handleAddMember} className="add-member-form">
                        <div className="form-group">
                            <input
                                type="email"
                                placeholder="Enter email to add member"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn btn-primary">
                                Add Member
                            </button>
                        </div>
                    </form>
                </div>

                <div className="expenses-section">
                    <h2>Expenses</h2>
                    {expenses.length === 0 ? (
                        <p>No expenses yet. Add one to get started!</p>
                    ) : (
                        <div className="expenses-list">
                            {expenses.map(expense => (
                                <div key={expense._id} className="expense-item">
                                    <div className="expense-header">
                                        <h3>{expense.description}</h3>
                                        <span className="expense-amount">Rs. {expense.amount.toFixed(2)}</span>
                                        {expense.paidBy.user === user._id && (
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={async () => {
                                                    try {
                                                        if (window.confirm('Are you sure you want to delete this expense?')) {
                                                            await axios.delete(`/expenses/${expense._id}`);
                                                            // Update the expenses state immediately
                                                            setExpenses(prevExpenses =>
                                                                prevExpenses.filter(e => e._id !== expense._id)
                                                            );
                                                            // Emit socket event for real-time update
                                                            if (socket) {
                                                                socket.emit('expense_deleted', {
                                                                    groupId: id,
                                                                    expenseId: expense._id
                                                                });
                                                            }
                                                        }
                                                    } catch (err) {
                                                        setError('Failed to delete expense');
                                                        console.error('Error deleting expense:', err);
                                                    }
                                                }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <div className="expense-details">
                                        <p>Paid by: {expense.paidBy.name}</p>
                                        <p>Date: {new Date(expense.date).toLocaleDateString()}</p>
                                        <p>Category: {expense.category}</p>
                                    </div>
                                    <div className="expense-splits">
                                        <h4>Split Among:</h4>
                                        <ul>
                                            {expense.splitAmong.map(split => (
                                                <li key={split.user} className={`split-item ${split.settled ? 'settled' : ''}`}>
                                                    <span>{split.name}: Rs. {split.amount.toFixed(2)}</span>
                                                    {split.user === user._id && !split.settled && expense.paidBy.user !== user._id && (
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={async () => {
                                                                try {
                                                                    const response = await axios.put(`/expenses/settle/${expense._id}`);
                                                                    // Update the expenses state immediately
                                                                    setExpenses(prevExpenses =>
                                                                        prevExpenses.map(exp =>
                                                                            exp._id === expense._id ? response.data : exp
                                                                        )
                                                                    );
                                                                    // Emit socket event for real-time update
                                                                    if (socket) {
                                                                        socket.emit('settlement_update', {
                                                                            groupId: id,
                                                                            expenseId: expense._id,
                                                                            expense: response.data
                                                                        });
                                                                    }
                                                                } catch (err) {
                                                                    setError('Failed to mark as settled');
                                                                    console.error('Error marking as settled:', err);
                                                                }
                                                            }}
                                                        >
                                                            Mark as Settled
                                                        </button>
                                                    )}
                                                    {split.settled && <span className="settled-badge">Settled</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default GroupDetail;
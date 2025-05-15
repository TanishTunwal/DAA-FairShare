import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const AddExpense = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { socket } = useContext(AuthContext);

    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Other',
        splitType: 'equal' // equal, percentage, custom
    });

    const [splits, setSplits] = useState([]);

    const { description, amount, category, splitType } = formData;

    // Fetch group details
    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const res = await axios.get(`/groups/${groupId}`);
                setGroup(res.data);

                // Initialize splits with group members
                const initialSplits = res.data.members.map(member => ({
                    userId: member.user,
                    name: member.name,
                    amount: 0,
                    percentage: 0
                }));

                setSplits(initialSplits);
                setLoading(false);
            } catch (err) {
                setError('Error fetching group data');
                console.error('Error fetching group data:', err);
                setLoading(false);
            }
        };

        fetchGroup();
    }, [groupId]);

 
    // const onChange = e => {
    //     setFormData({ ...formData, [e.target.name]: e.target.value });

    //     // Recalculate splits when amount or split type changes
    //     if (e.target.name === 'amount' || e.target.name === 'splitType') {
    //         updateSplits(e.target.name === 'amount' ? e.target.value : amount, e.target.name === 'splitType' ? e.target.value : splitType);
    //     }
    // };

    // Inside AddExpense component

    const updateSplits = (newAmount, newSplitType) => {
        const numAmount = parseFloat(newAmount) || 0;
        const memberCount = splits.length;

        if (newSplitType === 'equal') {
            // Equal split: divide amount equally among members
            const equalAmount = memberCount > 0 ? numAmount / memberCount : 0;
            setSplits(
                splits.map((split) => ({
                    ...split,
                    amount: parseFloat(equalAmount.toFixed(2)),
                    percentage: parseFloat((100 / memberCount).toFixed(2)),
                }))
            );
        } else if (newSplitType === 'percentage') {
            // Percentage mode: maintain existing percentages, update amounts
            setSplits(
                splits.map((split) => ({
                    ...split,
                    amount: parseFloat((numAmount * (split.percentage / 100)).toFixed(2)),
                }))
            );
        } else if (newSplitType === 'custom') {
            // Custom mode: maintain existing amounts, update percentages
            setSplits(
                splits.map((split) => ({
                    ...split,
                    percentage:
                        numAmount > 0
                            ? parseFloat(((split.amount / numAmount) * 100).toFixed(2))
                            : 0,
                }))
            );
        }
    };

    const handleSplitChange = (index, field, value) => {
        const newSplits = [...splits];
        const numValue = parseFloat(value) || 0;
        const totalAmount = parseFloat(amount) || 0;

        // Update the changed field
        newSplits[index][field] = numValue;

        if (splitType === 'percentage' && field === 'percentage') {
            // In percentage mode, update the amount based on the new percentage
            newSplits[index].amount = parseFloat(
                ((numValue / 100) * totalAmount).toFixed(2)
            );

            // Normalize percentages to sum to 100%
            const totalPercentage = newSplits.reduce(
                (sum, split) => sum + split.percentage,
                0
            );
            if (totalPercentage !== 100 && totalPercentage > 0) {
                const remainingPercentage = 100 - numValue;
                const otherSplits = newSplits.filter((_, i) => i !== index);
                const otherTotalPercentage = otherSplits.reduce(
                    (sum, split) => sum + split.percentage,
                    0
                );

                if (otherTotalPercentage > 0) {
                    const scale = remainingPercentage / otherTotalPercentage;
                    otherSplits.forEach((split) => {
                        split.percentage = parseFloat(
                            (split.percentage * scale).toFixed(2)
                        );
                        split.amount = parseFloat(
                            ((split.percentage / 100) * totalAmount).toFixed(2)
                        );
                    });
                } else {
                    // If no other percentages, distribute remaining equally
                    const remainingMembers = newSplits.length - 1;
                    otherSplits.forEach((split) => {
                        split.percentage = parseFloat(
                            (remainingPercentage / remainingMembers).toFixed(2)
                        );
                        split.amount = parseFloat(
                            ((split.percentage / 100) * totalAmount).toFixed(2)
                        );
                    });
                }
            }
        } else if (splitType === 'custom' && field === 'amount') {
            // In custom mode, update the percentage based on the new amount
            newSplits[index].percentage =
                totalAmount > 0
                    ? parseFloat(((numValue / totalAmount) * 100).toFixed(2))
                    : 0;

            // Normalize amounts to sum to totalAmount
            const totalSplitAmount = newSplits.reduce(
                (sum, split) => sum + split.amount,
                0
            );
            if (totalSplitAmount !== totalAmount && totalSplitAmount > 0) {
                const remainingAmount = totalAmount - numValue;
                const otherSplits = newSplits.filter((_, i) => i !== index);
                const otherTotalAmount = otherSplits.reduce(
                    (sum, split) => sum + split.amount,
                    0
                );

                if (otherTotalAmount > 0) {
                    const scale = remainingAmount / otherTotalAmount;
                    otherSplits.forEach((split) => {
                        split.amount = parseFloat((split.amount * scale).toFixed(2));
                        split.percentage =
                            totalAmount > 0
                                ? parseFloat(
                                    ((split.amount / totalAmount) * 100).toFixed(2)
                                )
                                : 0;
                    });
                } else {
                    // If no other amounts, distribute remaining equally
                    const remainingMembers = newSplits.length - 1;
                    otherSplits.forEach((split) => {
                        split.amount = parseFloat(
                            (remainingAmount / remainingMembers).toFixed(2)
                        );
                        split.percentage =
                            totalAmount > 0
                                ? parseFloat(
                                    ((split.amount / totalAmount) * 100).toFixed(2)
                                )
                                : 0;
                    });
                }
            }
        }

        setSplits(newSplits);
    };

    // Update the onChange handler to ensure splits are recalculated correctly
    const onChange = (e) => {
        const newFormData = { ...formData, [e.target.name]: e.target.value };
        setFormData(newFormData);

        // Recalculate splits when amount or split type changes
        if (e.target.name === 'amount' || e.target.name === 'splitType') {
            updateSplits(
                e.target.name === 'amount' ? e.target.value : amount,
                e.target.name === 'splitType' ? e.target.value : splitType
            );
        }
    };

    // Update the onSubmit validation to provide clearer feedback
    const onSubmit = async (e) => {
        e.preventDefault();

        const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
        const expenseAmount = parseFloat(amount) || 0;
        const totalPercentage = splits.reduce(
            (sum, split) => sum + split.percentage,
            0
        );

        if (Math.abs(totalSplitAmount - expenseAmount) > 0.01) {
            setError(
                `Split amounts (${totalSplitAmount.toFixed(
                    2
                )}) must equal the total expense amount (${expenseAmount.toFixed(2)})`
            );
            return;
        }

        if (splitType === 'percentage' && Math.abs(totalPercentage - 100) > 0.01) {
            setError(
                `Total percentage (${totalPercentage.toFixed(
                    2
                )}%) must equal 100% in percentage mode`
            );
            return;
        }

        try {
            const res = await axios.post('/expenses', {
                description,
                amount: expenseAmount,
                groupId,
                splitAmong: splits,
                category,
            });

            if (socket) {
                socket.emit('new_expense', {
                    groupId,
                    expense: res.data,
                });
            }

            navigate(`/groups/${groupId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add expense');
            console.error('Error adding expense:', err.response?.data);
        }
    };

    if (loading) {
        return <div className="container">Loading...</div>;
    }

    return (
        <section className="container">
            <h1>Add New Expense</h1>
            <p>Group: {group && group.name}</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        value={description}
                        onChange={onChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="amount">Amount (Rs.)</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={amount}
                        onChange={onChange}
                        step="0.01"
                        min="0.01"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                        id="category"
                        name="category"
                        value={category}
                        onChange={onChange}
                    >
                        <option value="Food">Food</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Housing">Housing</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Travel">Travel</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Split Type</label>
                    <div className="split-type-options">
                        <div>
                            <input
                                type="radio"
                                id="equal"
                                name="splitType"
                                value="equal"
                                checked={splitType === 'equal'}
                                onChange={onChange}
                            />
                            <label htmlFor="equal">Equal</label>
                        </div>
                        <div>
                            <input
                                type="radio"
                                id="percentage"
                                name="splitType"
                                value="percentage"
                                checked={splitType === 'percentage'}
                                onChange={onChange}
                            />
                            <label htmlFor="percentage">Percentage</label>
                        </div>
                        <div>
                            <input
                                type="radio"
                                id="custom"
                                name="splitType"
                                value="custom"
                                checked={splitType === 'custom'}
                                onChange={onChange}
                            />
                            <label htmlFor="custom">Custom</label>
                        </div>
                    </div>
                </div>

                <div className="splits-section">
                    <h3>Split Among</h3>
                    <div className="splits-list">
                        {splits.map((split, index) => (
                            <div key={split.userId} className="split-item">
                                <span className="split-name">{split.name}</span>
                                <div className="split-inputs">
                                    <div className="split-input">
                                        <label>Amount (Rs.)</label>
                                        <input
                                            type="number"
                                            value={split.amount}
                                            onChange={(e) => handleSplitChange(index, 'amount', e.target.value)}
                                            step="0.01"
                                            min="0"
                                            disabled={splitType !== 'custom'}
                                        />
                                    </div>
                                    <div className="split-input">
                                        <label>Percentage (%)</label>
                                        <input
                                            type="number"
                                            value={split.percentage}
                                            onChange={(e) => handleSplitChange(index, 'percentage', e.target.value)}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            disabled={splitType !== 'percentage'}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="splits-summary">
                        <p>
                            Total Split Amount: Rs. {splits.reduce((sum, split) => sum + split.amount, 0).toFixed(2)}
                        </p>
                        <p>
                            Total Percentage: {splits.reduce((sum, split) => sum + split.percentage, 0).toFixed(2)}%
                        </p>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        Add Expense
                    </button>
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => navigate(`/groups/${groupId}`)}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </section>
    );
};

export default AddExpense; 
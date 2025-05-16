import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

// Custom label for pie chart that only shows category names (no percentages)
const renderCustomizedPieLabel = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, category } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.35;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Truncate long category names
    const displayCategory = category.length > 15 ? `${category.substring(0, 12)}...` : category;

    // Only show labels for segments with decent size to avoid clutter
    if (outerRadius - innerRadius < 10) return null;

    return (
        <text
            x={x}
            y={y}
            fill="#333"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            fontSize={12}
        >
            {displayCategory}
        </text>
    );
};

const ExpenseAnalysis = () => {
    const { groupId } = useParams();
    const [group, setGroup] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch group and analysis data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get group details
                const groupRes = await axios.get(`/groups/${groupId}`);
                setGroup(groupRes.data);

                // Get expense analysis
                const analysisRes = await axios.get(`/expenses/analysis/${groupId}`);
                setAnalysis(analysisRes.data);

                setLoading(false);
            } catch (err) {
                setError('Error fetching analysis data');
                console.error('Error fetching analysis data:', err);
                setLoading(false);
            }
        };

        fetchData();
    }, [groupId]);

    if (loading) {
        return <div className="container">Loading...</div>;
    }

    if (!analysis) {
        return <div className="container">No analysis data available</div>;
    } return (
        <section className="container">
            <Link to={`/groups/${groupId}`} className="btn btn-light">
                Back to Group
            </Link>

            <h1>Expense Analysis</h1>
            <p>Group: {group && group.name}</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="analysis-content" style={{ marginTop: '2rem' }}>
                <div className="analysis-summary" style={{
                    backgroundColor: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '2rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <h3>Summary</h3>
                    <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>
                        Total Expenses: <span style={{ color: '#28a745' }}>₹{analysis.totalAmount.toFixed(2)}</span>
                    </p>
                </div>                <div className="analysis-charts" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '2rem',
                    marginBottom: '2rem'
                }}>
                    <div className="chart-container" style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        height: '400px' // Fixed height
                    }}>
                        <h3>Expenses by Category</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analysis.categoryExpenses}
                                    dataKey="amount"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    labelLine={false}
                                    label={renderCustomizedPieLabel}
                                >
                                    {analysis.categoryExpenses.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `₹${value.toFixed(2)}`}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div style={{
                                                    backgroundColor: '#fff',
                                                    padding: '10px',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                }}>
                                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{data.category}</p>
                                                    <p style={{ margin: 0 }}>Amount: ₹{data.amount.toFixed(2)}</p>
                                                    <p style={{ margin: 0 }}>Percentage: {data.percentage.toFixed(2)}%</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-container" style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        height: '400px' // Fixed height
                    }}>
                        <h3>Expenses by User</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={analysis.userExpenses}
                                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                                layout="vertical"
                            >
                                <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={80}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    formatter={(value) => `₹${value.toFixed(2)}`}
                                    labelFormatter={(value) => `User: ${value}`}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div style={{
                                                    backgroundColor: '#fff',
                                                    padding: '10px',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                }}>
                                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{data.name}</p>
                                                    <p style={{ margin: 0 }}>Amount: ₹{data.amount.toFixed(2)}</p>
                                                    <p style={{ margin: 0 }}>Percentage: {data.percentage.toFixed(2)}%</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="amount" name="Amount Spent" barSize={20}>
                                    {analysis.userExpenses.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>                <div className="analysis-details" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '2rem'
                }}><div className="distribution-table" style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}>
                        <h4>By Category</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Category</th>
                                        <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', minWidth: '100px' }}>Amount</th>
                                        <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', minWidth: '100px' }}>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.categoryExpenses.map((category, index) => (
                                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                                            <td style={{
                                                padding: '12px',
                                                border: '1px solid #dee2e6',
                                                wordBreak: 'break-word',
                                                maxWidth: '250px'
                                            }}>
                                                {category.category}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>₹{category.amount.toFixed(2)}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>{category.percentage.toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>                    <div className="distribution-table" style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h4>By User</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>User</th>
                                        <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', minWidth: '100px' }}>Amount</th>
                                        <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6', minWidth: '100px' }}>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.userExpenses.map((user, index) => (
                                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                                            <td style={{
                                                padding: '12px',
                                                border: '1px solid #dee2e6',
                                                wordBreak: 'break-word',
                                                maxWidth: '250px'
                                            }}>
                                                {user.name}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>₹{user.amount.toFixed(2)}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #dee2e6' }}>{user.percentage.toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ExpenseAnalysis; 
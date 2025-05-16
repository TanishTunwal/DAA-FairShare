import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import * as d3 from 'd3';

const SettlementPlan = () => {
    const { groupId } = useParams();
    const [group, setGroup] = useState(null);
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const graphRef = useRef(null);

    // Fetch group and settlement data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get group details
                const groupRes = await axios.get(`/groups/${groupId}`);
                setGroup(groupRes.data);

                // Get settlement plan
                const settlementRes = await axios.get(`/expenses/settlement/${groupId}`);
                setSettlements(settlementRes.data);

                setLoading(false);
            } catch (err) {
                setError('Error fetching settlement data');
                console.error('Error fetching settlement data:', err);
                setLoading(false);
            }
        };

        fetchData();
    }, [groupId]);

    // Create graph visualization
    useEffect(() => {
        if (!loading && settlements.length > 0 && graphRef.current) {
            createGraph();
        }
    }, [loading, settlements]); const createGraph = () => {
        // Clear previous graph
        d3.select(graphRef.current).selectAll('*').remove();

        // Fixed dimensions for the graph
        const width = 500;
        const height = 400;

        // Container with border
        const container = d3.select(graphRef.current)
            .style('width', `${width}px`)
            .style('height', `${height}px`)
            .style('margin', '0 auto')
            .style('border', '1px solid #ddd')
            .style('border-radius', '8px')
            .style('overflow', 'hidden')
            .style('background', '#f9f9f9');

        // Create SVG
        const svg = container
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('display', 'block');

        // Add a background
        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', '#f9f9f9');

        // Create nodes (users)
        const nodes = [];
        const nodeMap = {};

        if (group && group.members) {
            group.members.forEach(member => {
                const node = {
                    id: member.user,
                    name: member.name,
                    x: Math.random() * width,
                    y: Math.random() * height
                };
                nodes.push(node);
                nodeMap[member.user] = node;
            });
        }

        // Create links (settlements)
        const links = settlements.map(settlement => ({
            source: settlement.from.id,
            target: settlement.to.id,
            value: settlement.amount,
            amount: settlement.amount
        }));

        // Calculate max amount for normalized line thickness
        const maxAmount = Math.max(...links.map(link => link.amount), 1);

        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(40)) // Prevent overlapping
            .on('tick', ticked);        // Create links with uniform thickness regardless of amount
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('stroke', '#666')
            .attr('stroke-width', 2); // Fixed thickness for all links// Create nodes with improved styling
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('r', 25) // Fixed size for nodes
            .attr('fill', '#4CAF50')
            .attr('stroke', '#388E3C')
            .attr('stroke-width', 2)
            .style('cursor', 'grab')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        // Add user initials in nodes
        const nodeLabels = svg.append('g')
            .selectAll('text')
            .data(nodes)
            .enter()
            .append('text')
            .text(d => getInitials(d.name))
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', 'white');

        // Add name labels outside nodes
        const nameLabels = svg.append('g')
            .selectAll('text')
            .data(nodes)
            .enter()
            .append('text')
            .text(d => d.name)
            .attr('font-size', 12)
            .attr('text-anchor', 'middle')
            .attr('dy', 40)
            .attr('fill', '#333');

        // Add arrows for direction with consistent size
        svg.append('defs').selectAll('marker')
            .data(['arrow']) // Use just one arrow style
            .enter()
            .append('marker')
            .attr('id', 'arrow-marker')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 35) // Position relative to node
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#666');

        // Apply the arrow marker to all links
        link.attr('marker-end', 'url(#arrow-marker)');

        // Add amount labels with better positioning and background
        const linkLabels = svg.append('g')
            .selectAll('g')
            .data(links)
            .enter()
            .append('g');

        // Background rectangle for amount labels
        linkLabels.append('rect')
            .attr('fill', 'white')
            .attr('stroke', '#ddd')
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('opacity', 0.8);

        // Amount text
        const amountTexts = linkLabels.append('text')
            .text(d => `₹${d.amount.toFixed(0)}`)
            .attr('font-size', 10)
            .attr('fill', '#333')
            .attr('text-anchor', 'middle');        // Function to get initials from name
        function getInitials(name) {
            if (!name) return "?";
            return name
                .split(' ')
                .map(part => part[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
        } function ticked() {
            // Update link positions
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            // Update node positions
            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            // Update node initial labels
            nodeLabels
                .attr('x', d => d.x)
                .attr('y', d => d.y);

            // Update name labels
            nameLabels
                .attr('x', d => d.x)
                .attr('y', d => d.y);

            // Update link label positions
            linkLabels.attr('transform', d => {
                // Position at midpoint of the link
                const x = (d.source.x + d.target.x) / 2;
                const y = (d.source.y + d.target.y) / 2;

                // Calculate offset based on link angle for better positioning
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;

                return `translate(${x}, ${y}) rotate(${angle})`;
            });

            // Calculate and adjust the size of the label background rectangles
            linkLabels.selectAll('rect')
                .each(function (d) {
                    const text = d3.select(this.parentNode).select('text');
                    const bbox = text.node().getBBox();
                    d3.select(this)
                        .attr('x', bbox.x - 5)
                        .attr('y', bbox.y - 2)
                        .attr('width', bbox.width + 10)
                        .attr('height', bbox.height + 4);
                });

            // Adjust position of amount text
            amountTexts
                .attr('transform', 'rotate(0)'); // Keep text horizontal
        }

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    };

    if (loading) {
        return <div className="container">Loading...</div>;
    }

    return (
        <section className="container">
            <Link to={`/groups/${groupId}`} className="btn btn-light">
                Back to Group
            </Link>

            <h1>Settlement Plan</h1>
            <p>Group: {group && group.name}</p>

            {error && <div className="alert alert-danger">{error}</div>}            <div className="settlement-content">
                {settlements.length === 0 ? (
                    <p>No settlements needed! Everyone is settled up.</p>
                ) : (
                    <>
                        <div className="settlement-list" style={{
                            backgroundColor: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                            marginBottom: '2rem'
                        }}>
                            <h3>Optimal Settlement Plan</h3>
                            <p className="settlement-explanation" style={{ marginBottom: '1.5rem', color: '#666' }}>
                                This plan uses graph algorithms to minimize the number of transactions needed to settle all debts.
                            </p>
                            <ul style={{ listStyleType: 'none', padding: 0 }}>
                                {settlements.map((settlement, index) => (
                                    <li key={index} className="settlement-item" style={{
                                        padding: '12px 15px',
                                        margin: '8px 0',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '6px',
                                        border: '1px solid #e9ecef',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold' }}>{settlement.from.name}</span>
                                            <span style={{ margin: '0 10px', color: '#666' }}>pays</span>
                                            <span style={{ fontWeight: 'bold', color: '#28a745' }}>₹{settlement.amount.toFixed(2)}</span>
                                            <span style={{ margin: '0 10px', color: '#666' }}>to</span>
                                            <span style={{ fontWeight: 'bold' }}>{settlement.to.name}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>                        <div className="settlement-graph" style={{
                            backgroundColor: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <h3>Debt Graph Visualization</h3>
                            <p className="graph-explanation" style={{ marginBottom: '1.5rem', color: '#666' }}>
                                This graph shows who owes money to whom. Arrows indicate the direction of payment.
                            </p>
                            <div className="graph-container" ref={graphRef}></div>
                            <p className="graph-instructions" style={{ marginTop: '1rem', color: '#666', fontStyle: 'italic' }}>
                                <small>You can drag the nodes to rearrange the graph.</small>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default SettlementPlan; 
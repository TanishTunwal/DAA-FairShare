<<<<<<< HEAD

# FairShareProject

=======

# Expense Sharing DAA Project

A full-stack expense sharing application built with the MERN stack (MongoDB, Express, React, Node.js) that uses graph algorithms to optimize expense settlements.

## Features

- User authentication and authorization
- Create and manage expense groups
- Add expenses with different splitting options (equal, percentage, custom)
- Visualize debt relationships using graph algorithms
- Generate optimal settlement plans to minimize the number of transactions
- Real-time updates using Socket.io
- Expense analytics with charts and visualizations

## Graph Algorithms Used

This project implements several graph algorithms for expense management:

1. **Debt Graph Construction**: Creates a directed weighted graph where nodes represent users and edges represent debts.

2. **Cycle Elimination**: Uses a modified Depth-First Search (DFS) algorithm to find and eliminate cycles in the debt graph, reducing the number of transactions.

3. **Optimal Settlement Plan**: Implements a greedy algorithm to find the minimum number of transactions needed to settle all debts.

4. **Graph Visualization**: Uses D3.js to create interactive visualizations of the debt graph.

## Technology Stack

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io for real-time updates
- Passport.js with OAuth 2.0 for authentication

### Frontend

- React (with Vite)
- React Router for navigation
- Axios for API requests
- D3.js and Recharts for data visualization
- Socket.io-client for real-time updates

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to the server directory:

   ```
   cd expense-sharing-daa/server
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file with the following variables:

   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/expense-sharing-daa
   CLIENT_URL=http://localhost:5173
   SERVER_URL=http://localhost:5000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SESSION_SECRET=your_session_secret_key
   ```

4. Start the server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:

   ```
   cd expense-sharing-daa/client
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
expense-sharing-daa/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # Source files
│       ├── components/     # React components
│       ├── context/        # Context API
│       └── App.jsx         # Main App component
│
└── server/                 # Node.js backend
    ├── algorithms/         # Graph algorithms
    ├── controllers/        # Route controllers
    ├── middleware/         # Custom middleware
    ├── models/             # Mongoose models
    ├── routes/             # API routes
    └── index.js            # Entry point
```

## Algorithm Complexity Analysis

- **Debt Graph Construction**: O(n) time complexity, where n is the number of expenses.
- **Cycle Elimination**: O(V + E) time complexity, where V is the number of users and E is the number of debts.
- **Optimal Settlement Plan**: O(n log n) time complexity, where n is the number of users.

## Future Enhancements

- Implement more advanced graph algorithms for debt simplification
- Add support for recurring expenses
- Implement currency conversion
- Add mobile app support

## License

This project is licensed under the MIT License.

> > > > > > > 6646078 (FairShare)

# DAA-FairShare

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import OvenScheduler from './components/OvenScheduler';
import FoodPage from './components/FoodPage';
import './App.css';

function App() {
  return (
    <Router>
      <div>
        {/* Bootstrap Navbar */}
        <Navbar bg="light" expand="lg">
          <Container>
            <Navbar.Brand href="/">Oven Scheduler</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">OvenScheduler</Nav.Link>
                <Nav.Link as={Link} to="/food">Food</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<OvenScheduler />} />
          <Route path="/food" element={<FoodPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

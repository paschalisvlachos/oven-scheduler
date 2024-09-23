import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Alert, ListGroup } from 'react-bootstrap';

function FoodPage() {
  const [foods, setFoods] = useState([]);
  const [newFood, setNewFood] = useState({ title: '', duration: '', color: '#000000' });
  const [editingFood, setEditingFood] = useState(null); // To keep track of food being edited
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch food items from the backend
  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = () => {
    axios.get('/api/foods')
      .then((response) => setFoods(response.data))
      .catch((error) => setError('Error fetching foods. Please try again.'));
  };

  // Handle form submit to add a new or edit existing food item
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation: ensure all fields are filled
    if (!newFood.title || !newFood.duration || !newFood.color) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    
    if (editingFood) {
      // Edit existing food
      axios.put(`/api/foods/${editingFood._id}`, newFood)
        .then(() => {
          fetchFoods(); // Refresh the food list after updating
          resetForm();
        })
        .catch(() => setError('Error updating food. Please try again.'))
        .finally(() => setLoading(false));
    } else {
      // Add new food
      axios.post('/api/foods', newFood)
        .then((response) => {
          setFoods([...foods, response.data]); // Update food list with new food
          resetForm();
        })
        .catch(() => setError('Error adding food. Please try again.'))
        .finally(() => setLoading(false));
    }
  };

  // Set the form fields when editing
  const handleEdit = (food) => {
    setNewFood({ title: food.title, duration: food.duration, color: food.color });
    setEditingFood(food);
  };

  // Handle delete functionality
  const handleDelete = (id) => {
    setLoading(true);
    axios.delete(`/api/foods/${id}`)
      .then(() => {
        fetchFoods(); // Refresh the food list after deletion
      })
      .catch(() => setError('Error deleting food. Please try again.'))
      .finally(() => setLoading(false));
  };

  // Reset the form after adding or editing
  const resetForm = () => {
    setNewFood({ title: '', duration: '', color: '#000000' });
    setEditingFood(null);
    setError(null);
  };

  return (
    <Container className="mt-4">

      {/* Add/Edit Food Form */}
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3" controlId="foodTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter food title"
                value={newFood.title}
                onChange={(e) => setNewFood({ ...newFood, title: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3" controlId="foodDuration">
              <Form.Label>Duration (mins)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter duration in minutes"
                value={newFood.duration}
                onChange={(e) => setNewFood({ ...newFood, duration: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3" controlId="foodColor">
              <Form.Label>Color</Form.Label>
              <Form.Control
                type="color"
                value={newFood.color}
                onChange={(e) => setNewFood({ ...newFood, color: e.target.value })}
              />
            </Form.Group>
          </Col>
        </Row>

        <Button variant={editingFood ? 'warning' : 'primary'} type="submit" disabled={loading}>
          {editingFood ? 'Update Food' : 'Add Food'}
        </Button>
        {editingFood && <Button variant="secondary" className="ms-2" onClick={resetForm}>Cancel Edit</Button>}
      </Form>

      {/* Display loading or error messages */}
      {loading && <Alert variant="info" className="mt-4">Loading...</Alert>}
      {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

      {/* Display list of foods */}
      <ListGroup className="mt-4">
        {foods.length === 0 ? (
          <Alert variant="info">No food items available.</Alert>
        ) : (
          foods.map((food) => (
            <ListGroup.Item key={food._id} className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{food.title}</strong> ({food.duration} mins) - 
                <span style={{ color: food.color, marginLeft: '10px' }}>{food.color}</span>
              </div>
              <div>
                <Button variant="outline-warning" size="sm" onClick={() => handleEdit(food)}>Edit</Button>
                <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => handleDelete(food._id)}>Delete</Button>
              </div>
            </ListGroup.Item>
          ))
        )}
      </ListGroup>
    </Container>
  );
}

export default FoodPage;

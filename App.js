import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setToken(token);
    }
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post('/login', { email, password });
      const token = response.data.token;
      setToken(token);
      localStorage.setItem('token', token);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignup = async (name, email, password) => {
    try {
      const response = await axios.post('/signup', { name, email, password });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTaskCreate = async (title, description, status) => {
    try {
      const response = await axios.post('/tasks', { title, description, status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks([...tasks, response.data]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTaskUpdate = async (id, title, description, status) => {
    try {
      const response = await axios.put(`/tasks/${id}`, { title, description, status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.map((task) => task.id === id ? response.data : task));
    } catch (error) {
      console.error(error);
    }
  };

  const handleTaskDelete = async (id) => {
    try {
      await axios.delete(`/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleProfileUpdate = async (name, email, password) => {
    try {
      const response = await axios.put('/profile', { name, email, password }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Todo App</h1>
      <Login handleLogin={handleLogin} handleSignup={handleSignup} />
      {token && (
        <div>
          <TaskList tasks={tasks} handleTaskCreate={handleTaskCreate} handleTaskUpdate={handleTaskUpdate} handleTaskDelete={handleTaskDelete} />
          <Profile profile={profile} handleProfileUpdate={handleProfileUpdate} />
        </div>
      )}
    </div>
  );
}

export default App;

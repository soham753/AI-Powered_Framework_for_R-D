import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate(); 

  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    passwordMatch: false,
    emailValid: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setErrors(prev => ({
        ...prev,
        emailValid: emailRegex.test(value)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords don't match!");
      return;
    }

    if (!errors.emailValid) {
      setErrorMessage("Invalid email format!");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          emp_id: formData.employeeId,
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('Registration successful!');
        setFormData({
          name: '',
          employeeId: '',
          email: '',
          password: '',
          confirmPassword: ''
        });

        setTimeout(() => {
          navigate('/login');
        }, 1000);
      } else {
        setErrorMessage(result.error || 'Registration failed');
      }
    } catch (err) {
      setErrorMessage('Server error. Please try again.');
      console.error(err);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="card-header">
            <h2>Employee Registration</h2>
            <p className="card-subtitle">Join our team in just a few steps</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="employeeId">Employee ID</label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={!errors.emailValid ? 'invalid' : ''}
              />
              {!errors.emailValid && (
                <span className="error-message">Please enter a valid email</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={errors.passwordMatch ? 'invalid' : ''}
                />
                {errors.passwordMatch && (
                  <span className="error-message">Passwords don't match</span>
                )}
              </div>
            </div>

            {errorMessage && <div className="error-message-box">{errorMessage}</div>}
            {successMessage && <div className="success-message-box">{successMessage}</div>}

            <button type="submit" className="register-button" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

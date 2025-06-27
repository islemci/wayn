import React, { useState } from 'react';
import { Widget } from './src/react/Widget';

export default function ExampleForm() {
  const [token, setToken] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSolve = (solvedToken: string) => {
    setToken(solvedToken);
    console.log('CAPTCHA solved! Token:', solvedToken);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      alert('Please complete the CAPTCHA first');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Your form submission logic here
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // your form data
          waynToken: token,
        }),
      });

      if (response.ok) {
        alert('Form submitted successfully!');
        setToken(''); // Reset for next submission
      } else {
        alert('Failed to submit form');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred while submitting the form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>Contact Form</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="name">Name:</label>
          <input
            id="name"
            type="text"
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            required
            rows={4}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Widget
            api="https://wayn.tekir.co"
            color="light"
            onSolve={handleSolve}
            onError={(error) => console.error('CAPTCHA error:', error)}
            onProgress={(progress) => console.log('Progress:', progress + '%')}
          />
        </div>

        <button
          type="submit"
          disabled={!token || isSubmitting}
          style={{
            padding: '10px 20px',
            backgroundColor: token ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: token ? 'pointer' : 'not-allowed',
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

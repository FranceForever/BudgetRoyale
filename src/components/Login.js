// src/components/Login.js
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false); // Toggle between login and signup

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to dashboard
    } catch (error) {
      console.error('Error logging in: ', error);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store user information in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        budget: 0, // Default budget value, you can change this
        expenses: []
      });
      
      // Redirect to dashboard
    } catch (error) {
      console.error('Error signing up: ', error);
    }
  };

  return (
    <div>
      <h2>{isNewUser ? 'Signup' : 'Login'}</h2>
      <form onSubmit={isNewUser ? handleSignup : handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">{isNewUser ? 'Signup' : 'Login'}</button>
      </form>
      <button onClick={() => setIsNewUser(!isNewUser)}>
        {isNewUser ? 'Already have an account? Login' : 'New user? Signup'}
      </button>
    </div>
  );
};

export default Login;

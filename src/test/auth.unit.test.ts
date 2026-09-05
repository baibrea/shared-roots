// Unit Tests for Login and Registration

import { describe, it, expect } from '@jest/globals';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { loginUser, registerUser } from '../lib/auth';

jest.mock('firebase/auth', () => ({
    ...jest.requireActual("firebase/auth"),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
})); 

describe('Login', () => {
    it('Successful Login', async () => {
        const mockUser = {
            email: "fake@gmail.com",
            uid: "123456"
        };
        (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: mockUser });
        const result = await loginUser(mockUser.email, "123456");
        expect(result).toEqual(mockUser);
    });

    it('Failed Login - Invalid Credentials', async () => {
        (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
        await expect(loginUser("fake@gmail.com", "wrongpassword")).rejects.toThrow('Invalid credentials');
    });

    it('Missing Password', async () => {
        (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Missing password'));
        await expect(loginUser("fake@gmail.com", "")).rejects.toThrow('Missing password');
    });

    it('Invalid Email', async () => {
        (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Invalid email'));
        await expect(loginUser("invalidemail", "123456")).rejects.toThrow('Invalid email');
    });
});

// Successful Registration is part of Integration Testing
describe('Registration', () => {
    
    it('Failed Registration - Email Already In Use', async () => {
        (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Email already in use'));
        await expect(registerUser("newuser@gmail.com", "123456", "First", "Last")).rejects.toThrow('Email already in use');
    });
    
    it('Failed Registration - Missing Password', async () => {
        (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Missing password'));
        await expect(registerUser("newuser@gmail.com", "", "First", "Last")).rejects.toThrow('Missing password');
    });
    
    it('Failed Registration - Invalid Email', async () => {
        (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Invalid email'));
        await expect(registerUser("invalidemail", "123456", "First", "Last")).rejects.toThrow('Invalid email');
    });
});
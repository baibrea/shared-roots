// Integration Tests for login and registration functionality
import { loginUser, registerUser } from '../lib/auth'; 
import { signOut } from "firebase/auth";
import { auth, db } from '../lib/firebase';
import { deleteDoc, getDoc, doc } from "firebase/firestore";

// Check if login functionality works correctly - Backend only
describe('Firebase Login', () => {
    it('Login with correct credentials', async () => {
        const response = await loginUser("fake@gmail.com", "123456");
        expect(response).toBeDefined();

        // Check if the user document exists in Firestore
        const userDoc = await getDoc(doc(db, "users", auth.currentUser!.uid));
        expect(userDoc.exists()).toBe(true);
        signOut(auth);
    });
    
    it('Login with incorrect credentials', async () => {
        await expect(loginUser("thislogindoesnotexist@gmail.com", "wrongpassword"))
            .rejects.toMatchObject({ code: 'auth/invalid-credential' });
    });

    it ('Login with missing password', async () => {
        await expect(loginUser("fake@gmail.com", ""))
            .rejects.toMatchObject({ code: 'auth/missing-password' });
    });

    it('Login with wrong email format', async () => {
        await expect(loginUser("invalidemail", "123456"))
            .rejects.toMatchObject({ code: 'auth/invalid-email' });
    });
    
    it('Login with empty credentials', async () => {
        await expect(loginUser("", ""))
            .rejects.toMatchObject({ code: 'auth/invalid-email' });
    });
});

// Check if registration functionality works correctly
// Proper registration handled manually since it will fail after the first time
describe('Firebase Registration', () => {
    it('Register with correct credentials', async () => {
        const response = await registerUser("newuser@gmail.com", "123456", "new", "user");
        expect(response).toBeDefined();

        // Delete the user document from Firestore
        await deleteDoc(doc(db, "users", response.uid));

        // Delete the newly registered user
        if (auth.currentUser) {
            await auth.currentUser.delete();
        }
    });

    it('Register with existing email', async () => {
        await expect(registerUser("fake@gmail.com", "123456", "fake", "fake"))
            .rejects.toMatchObject({ code: 'auth/email-already-in-use' });
    });

    it('Register with wrong email format', async () => {
        await expect(registerUser("invalidemail", "123456", "fake", "fake"))
            .rejects.toMatchObject({ code: 'auth/invalid-email' });
    });

    it('Register with empty credentials', async () => {
        await expect(registerUser("", "", "", ""))
            .rejects.toMatchObject({ code: 'auth/invalid-email' });
    });

    it('Register with weak password', async () => {
        await expect(registerUser("newuser@gmail.com", "123", "new", "user"))
            .rejects.toMatchObject({ code: 'auth/weak-password' });
    });

    it ('Register with no password', async () => {
        await expect(registerUser("newuser@gmail.com", "", "new", "user"))
            .rejects.toMatchObject({ code: 'auth/missing-password' });
    });
});
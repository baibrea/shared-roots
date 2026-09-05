// Integration tests for invite functionality
import { sendInvite, acceptInvite } from '../lib/inbox';
import { auth, db } from '../lib/firebase';
import { getDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { loginUser } from '../lib/auth';

// Login is required before sending or accepting invites
beforeAll(async () => {
    // Logs in
    await loginUser("fake@gmail.com", "123456");

    // Ensure the user is logged in
    expect(auth.currentUser).toBeDefined();
});

// Sign out after all tests are done
afterAll(async () => {
    await signOut(auth);
});

describe('Send Invites', () => {
    it('Send an invite to non-existent user', async () => {
        await expect (sendInvite(
            "Automated test message",
            "9HPotTsyu7tgzkZPQcrk",
            "fake family",
            "first",
            "last",
            "nonexistentuser@gmail.com"
        )).rejects.toThrow("No account is associated with the provided email.");
    });

    it('Send an invite to an existing user', async () => {
        const inviteId = await sendInvite(
            "Automated test message",
            "9HPotTsyu7tgzkZPQcrk",
            "fake family",
            "first",
            "last",
            "inboxtest@gmail.com"
        );
        expect(inviteId).toBeDefined();
    });
});
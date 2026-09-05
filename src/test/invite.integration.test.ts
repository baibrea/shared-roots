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

// Family ID is coded into the UI so there is no worry for misinput
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

describe(' View Inbox Invitations', () => {
    it ('Check pending invites', async () => {
        // Check pending invites
        const docSnap = await getDoc(doc(db, "users", auth.currentUser?.uid || "", "inbox", "IW0EAaYQId3eppTzApM7"));
        expect(docSnap.exists()).toBe(true);

        // Verify contents
        expect(docSnap.data()?.status).toBe("pending");
        expect(docSnap.data()?.message).toBe("Join my family!");
        expect(docSnap.data()?.name).toBe("bre test");
    });

    it ('Check accepted invites', async () => {
        const acceptedDocSnap = await getDoc(doc(db, "users", auth.currentUser?.uid || "", "inbox", "FJner6bNPkmchm4SCOUe"));
        expect(acceptedDocSnap.exists()).toBe(true);

        // Verify contents
        expect(acceptedDocSnap.data()?.status).toBe("accepted");
        expect(acceptedDocSnap.data()?.message).toBe("Join my family");
        expect(acceptedDocSnap.data()?.name).toBe("John Doe");
    });
});
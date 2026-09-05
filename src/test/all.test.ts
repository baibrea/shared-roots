// Runs all tests in the project
import { exec } from 'child_process';

console.log("Running all tests...");

exec('npx jest auth.integration.test.ts', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing tests: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Test errors: ${stderr}`);
        return;
    }
    console.log(`Test results:\n${stdout}`);
});

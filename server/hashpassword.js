const bcrypt = require('bcrypt');

async function hashPassword(password) {
    // Note: The salt round (10) should match what's used in registerUser
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Password: ${password}`);
    console.log(`Hashed Password: ${hashedPassword}`);
}

// ⚠️ REPLACE 'your_admin_password_here' with the actual password you want!
hashPassword('assistantLibrarian2025'); 
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');

// ZeptoMail Credentials (replace 'YOUR_PASSWORD_HERE' with the actual check details if possible, but user has to enter it)
// Since I can't know the password hidden in '********', I will prompt for it or set a placeholder.
// The user passed 'emailapikey' and '********' in the request.

const newEnvVars = {
    EMAIL_HOST: 'smtp.zeptomail.in',
    EMAIL_PORT: '587',
    EMAIL_USER: 'emailapikey',
    // EMAIL_PASS is critical. The user showed stars. 
    // I will write this file to HELP them update it.
};

console.log('---------------------------------------------------------');
console.log(' AUTOMATIC ENV UPDATER ');
console.log('---------------------------------------------------------');

if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Helper to update or add a key
    const updateKey = (key, value) => {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            envContent += `\n${key}=${value}`;
        }
    };

    updateKey('EMAIL_HOST', 'smtp.zeptomail.in');
    updateKey('EMAIL_PORT', '587');
    updateKey('EMAIL_USER', 'emailapikey');

    // We add a placeholder for password if it doesn't look like a Zepto token already
    // Or we leave it alone and tell user to paste it. 
    // updateKey('EMAIL_PASS', 'PASTE_YOUR_ZEPTO_PASSWORD_HERE'); 

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with EMAIL_HOST, EMAIL_PORT, and EMAIL_USER.');
    console.log('⚠️  Please manually open backend/.env and paste your ZeptoMail Password into EMAIL_PASS.');
} else {
    console.error('❌ .env file not found at:', envPath);
}

#!/usr/bin/env node

const crypto = require('crypto');

const SMTP_REGIONS = [
    "us-east-2",  // US East (Ohio)
    "us-east-1",  // US East (N. Virginia)
    "us-west-2",  // US West (Oregon)
    "ap-south-1",  // Asia Pacific (Mumbai)
    "ap-northeast-2",  // Asia Pacific (Seoul)
    "ap-southeast-1",  // Asia Pacific (Singapore)
    "ap-southeast-2",  // Asia Pacific (Sydney)
    "ap-northeast-1",  // Asia Pacific (Tokyo)
    "ca-central-1",  // Canada (Central)
    "eu-central-1",  // Europe (Frankfurt)
    "eu-west-1",  // Europe (Ireland)
    "eu-west-2",  // Europe (London)
    "eu-south-1",  // Europe (Milan)
    "eu-north-1",  // Europe (Stockholm)
    "sa-east-1",  // South America (Sao Paulo)
    "us-gov-west-1",  // AWS GovCloud (US)
    "us-gov-east-1",  // AWS GovCloud (US)
];

// These values are required to calculate the signature. Do not change them.
const DATE = "11111111";
const SERVICE = "ses";
const MESSAGE = "SendRawEmail";
const TERMINAL = "aws4_request";
const VERSION = 0x04;

function sign(key, msg) {
    return crypto.createHmac('sha256', key).update(msg, 'utf8').digest();
}

function calculateKey(secretAccessKey, region) {
    if (!SMTP_REGIONS.includes(region)) {
        throw new Error(`The ${region} Region doesn't have an SMTP endpoint.`);
    }

    let signature = sign(Buffer.from("AWS4" + secretAccessKey, 'utf8'), DATE);
    signature = sign(signature, region);
    signature = sign(signature, SERVICE);
    signature = sign(signature, TERMINAL);
    signature = sign(signature, MESSAGE);
    
    const signatureAndVersion = Buffer.concat([Buffer.from([VERSION]), signature]);
    const smtpPassword = signatureAndVersion.toString('base64');
    
    return smtpPassword;
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length !== 3) {
        console.log('Usage: node generate_smtp_credentials.js <ACCESS_KEY_ID> <SECRET_ACCESS_KEY> <REGION>');
        console.log('Example: node generate_smtp_credentials.js AKIAIOSFODNN7EXAMPLE wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY us-east-1');
        process.exit(1);
    }
    
    const [accessKeyId, secretAccessKey, region] = args;
    
    try {
        const smtpPassword = calculateKey(secretAccessKey, region);
        
        console.log('AWS SES SMTP Credentials:');
        console.log('=' .repeat(40));
        console.log(`SMTP Username: ${accessKeyId}`);
        console.log(`SMTP Password: ${smtpPassword}`);
        console.log(`SMTP Host: email-smtp.${region}.amazonaws.com`);
        console.log(`SMTP Port: 587`);
        console.log('');
        console.log('Update your .env file with these credentials:');
        console.log(`AWS_SES_SMTP_USER=${accessKeyId}`);
        console.log(`AWS_SES_SMTP_PASSWORD=${smtpPassword}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

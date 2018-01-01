import createHash from 'create-hash';

export class PasswordHasher {
    static hash(password) {
        return createHash("sha256").update(password).digest('hex');
    }

    static validate(password, hash) {
        return PasswordHasher.hash(password) === hash
    }
}

export default PasswordHasher;
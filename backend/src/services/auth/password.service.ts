import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$.{53}$/

// Hash a plain text password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Compare a plain text password with a hashed password
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

// Check if a string is already a bcrypt hash
export const isPasswordHashed = (password: string): boolean => {
  return BCRYPT_HASH_REGEX.test(password)
}

import { bcryptHash, compareBcryptHash, sha256Hash } from '../../../../src/shared/helpers/hash.helper.js';

describe('hash helper', () => {
  describe('sha256Hash', () => {
    it('should generate consistent hash for same input', () => {
      //arrange
      const value = 'test123';
      //act
      const hash1 = sha256Hash(value);
      const hash2 = sha256Hash(value);

      //asserts
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should generate different hash for different value', () => {
      //act
      const hash1 = sha256Hash('12345k');
      const hash2 = sha256Hash('hgghg');
      //asserts
      expect(hash1).not.toBe(hash2);
    });
  });
  describe('bcrypt hash', () => {
    it('should hash and successfully compare correct password', async () => {
      //arrange
      const password = 'password@123';

      //act
      const hash = await bcryptHash(password);
      const compare = await compareBcryptHash(password, hash);

      //asserts
      expect(compare).toBe(true);
    });
    it('should fail comparison for wrong password', async () => {
      //arrange
      const password = 'password@123';

      //act
      const hash = await bcryptHash(password);
      const compare = await compareBcryptHash('wrongpassword', hash);

      //asserts
      expect(compare).toBe(false);
    });
  });
});

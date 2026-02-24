import '../../src/config/env.js';
import initDb from '../../src/config/init.js';
export default async () => {
  await initDb();
};

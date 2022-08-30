import { seedUser } from './user.seed.js';

const runSeeds = async () => {
  await seedUser();
  process.exit(0);
};

runSeeds();

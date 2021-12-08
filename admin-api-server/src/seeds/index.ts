import { seedUser } from './user.seed';

const runSeeds = async () => {
  await seedUser();
  process.exit(0);
};

runSeeds();

import Pool from 'pg-pool';
import { UserService } from '../user/service/user.service.js';
import { RoleService } from '../role/service/role.service.js';
import { Roles } from '../role/entities/role.entity.js';
import { assertEnv } from '../utils.js';

export const seedUser = async () => {
  const dbPool = new Pool({
    host: assertEnv('PGHOST'),
    port: Number(assertEnv('PGPORT')),
    user: assertEnv('PGUSER'),
    password: assertEnv('PGPASSWORD'),
    database: assertEnv('PGDATABASE'),
  });
  const roleService = new RoleService(dbPool);
  const userService = new UserService(dbPool);

  await roleService.createRoles();

  await userService.create({
    password: 'supersafepassword',
    roles: [Roles.admin],
    email: 'admin@tzconnect.com',
    userName: 'admin',
    id: 1,
  });

  await dbPool.end();
};

import { UserService } from 'src/user/service/user.service';
import { RoleService } from 'src/role/service/role.service';
import { Roles } from 'src/role/entities/role.entity';
import { assertEnv } from 'src/utils';
import * as Pool from 'pg-pool';

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

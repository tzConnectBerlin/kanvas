import { UserService } from '../user/user.service';
import { dbPool } from '../db.module';
import { RoleService } from '../role/role.service';

export const seedUser = async () => {
  const client = await dbPool.connect();
  const roleService = new RoleService(client);
  const userService = new UserService(client);
  const adminRole = await roleService.create({ id: 1, roleLabel: 'admin' });
  await userService.create({
    password: 'supersafepassword',
    roles: [adminRole.id],
    address: 'tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU',
    email: 'admin@tzconnect.com',
    userName: 'admin',
    id: 1,
  });
};

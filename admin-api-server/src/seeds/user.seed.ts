import { UserService } from '../user/service/user.service';
import { dbPool } from '../db.module';
import { RoleService } from '../role/role.service';
import { Roles } from '../role/role.entity';

export const seedUser = async () => {
  const roleService = new RoleService(dbPool);
  const userService = new UserService(dbPool);

  await roleService.createRoles();

  await userService.create({
    password: 'supersafepassword',
    roles: [Roles.admin],
    address: 'tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU',
    email: 'admin@tzconnect.com',
    userName: 'admin',
    id: 1,
  });
};

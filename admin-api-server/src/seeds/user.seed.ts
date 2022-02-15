import { UserService } from 'src/user/service/user.service';
import { dbPool } from 'src/db.module';
import { RoleService } from 'src/role/service/role.service';
import { Roles } from 'src/role/entities/role.entity';

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

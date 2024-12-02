import { Controller, Put, Delete, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { updateUser } from 'src/auth/dto/signUp.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: updateUser,
  ) {
    return this.userService.updateUser(id, updateData);
  }

}

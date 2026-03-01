import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/current-user.decorator';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOrCreateByExternal(externalId: string, details?: { email?: string | null; name?: string | null }): Promise<User> {
    let user = await this.userRepo.findOne({ where: { external_id: externalId } });
    if (!user) {
      user = this.userRepo.create({
        external_id: externalId,
        email: details?.email ?? null,
        name: details?.name ?? null,
      });
      await this.userRepo.save(user);
    } else if (details && (details.email !== undefined || details.name !== undefined)) {
      if (details.email !== undefined) user.email = details.email;
      if (details.name !== undefined) user.name = details.name;
      await this.userRepo.save(user);
    }
    return user;
  }

  async getOrCreateFromRequestUser(reqUser: RequestUser): Promise<User> {
    return this.findOrCreateByExternal(reqUser.id, {
      email: reqUser.email ?? undefined,
      name: reqUser.name ?? undefined,
    });
  }
}

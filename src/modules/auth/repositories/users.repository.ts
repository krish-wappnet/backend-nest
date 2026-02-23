import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async createUser(params: {
    email: string;
    passwordHash: string;
  }): Promise<User> {
    const entity = this.userRepo.create({
      email: params.email,
      passwordHash: params.passwordHash,
      isActive: true,
    });

    return this.userRepo.save(entity);
  }
}

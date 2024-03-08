import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';

import { Plant } from 'src/entities';
import { StatusOk } from 'src/types';
import {
  UpdatePlantDto,
  DeletePlantDto,
  ChangePasswordDto,
  ToggleFollowingDto,
} from './dto';

@Injectable()
export class PlantsService {
  constructor(
    @InjectRepository(Plant)
    private plantsRepository: Repository<Plant>,
  ) {}

  async updatePlant(dto: UpdatePlantDto): Promise<StatusOk> {
    let plant = await this.plantsRepository.findOne({
      where: { uuid: dto.uuid },
    });

    if (!plant) throw new BadRequestException('Plant does not exists');

    plant = await this.plantsRepository.save({
      ...plant,
      ...dto,
      updatedAt: new Date().valueOf(),
    });

    return {
      status: 201,
      message: 'Updated plant successfully',
      data: { name: dto.name },
    };
  }

  async toggleFollowing(dto: ToggleFollowingDto): Promise<StatusOk> {
    let plant = await this.plantsRepository.findOne({
      relations: ['followings'],
      where: { uuid: dto.uuid },
    });
    if (!plant) throw new BadRequestException('Plant does not exists');

    let followee = await this.plantsRepository.findOne({
      where: { plantname: dto.plantname },
    });
    if (!followee)
      throw new BadRequestException(`Plant "${dto.plantname}" does not exists`);

    const isFolloweeFn = (p: Plant) => p.plantname === dto.plantname;
    const isAlreadyFollowing = plant.followings.some(isFolloweeFn);

    const followings = isAlreadyFollowing
      ? plant.followings.filter((p) => !isFolloweeFn(p))
      : [followee].concat(plant.followings);

    plant = await this.plantsRepository.save({
      ...plant,
      followings,
      updatedAt: new Date().valueOf(),
    });

    return {
      status: 201,
      message:
        (isAlreadyFollowing ? 'Unf' : 'F') +
        `ollowed ${followee.plantname} successfully`,
      data: { name: followee.name, plantname: followee.plantname },
    };
  }

  async deletePlant(dto: DeletePlantDto): Promise<StatusOk> {
    let plant = await this.plantsRepository.findOne({
      where: { uuid: dto.uuid },
    });

    if (!plant) throw new BadRequestException('Plant does not exists');

    let passMatch = await argon2.verify(plant.password, dto.password);
    if (!passMatch) throw new BadRequestException('Invalid Credentials');

    await this.plantsRepository.delete({ uuid: plant.uuid });

    return {
      status: 201,
      message: `Plant '${plant.plantname}' deleted successfully`,
    };
  }

  async changePassword(dto: ChangePasswordDto): Promise<StatusOk> {
    let plant = await this.plantsRepository.findOne({
      where: { plantname: dto.plantname },
    });
    if (!plant) throw new BadRequestException('Plant does not exists');

    let passMatch = await argon2.verify(plant.password, dto.password);
    if (!passMatch) throw new BadRequestException('Invalid Credentials');

    let newPassMatch = await argon2.verify(plant.password, dto.newPassword);
    if (newPassMatch)
      throw new BadRequestException(
        "New password can't be same as the old one",
      );

    let newPasswordHash = await argon2.hash(dto.newPassword);

    plant = await this.plantsRepository.save({
      ...plant,
      password: newPasswordHash,
      updatedAt: new Date().valueOf(),
    });

    return {
      status: 201,
      message: `Password for '${dto.plantname}' updated successfully`,
    };
  }
}

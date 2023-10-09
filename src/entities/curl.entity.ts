import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Plant, Tendril } from './';

@Entity()
export class Curl {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 17, name: 'tendril_uuid' })
  tendrilUuid: string;

  @ManyToOne(() => Plant, (plant) => plant.curls)
  plant: Plant;

  @ManyToOne(() => Tendril, (tendril) => tendril.curls)
  tendril: Tendril;

  @Column()
  uuid: string;

  @Column({ name: 'created_at', default: () => new Date().valueOf() })
  createdAt: number;

  @Column({ name: 'updated_at', default: () => new Date().valueOf() })
  updatedAt: number;

  @BeforeInsert()
  createUuid() {
    this.uuid = uuidv4();
  }
}

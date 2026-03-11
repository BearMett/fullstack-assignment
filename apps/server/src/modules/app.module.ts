import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { createTypeOrmOptions, getEnvFilePath } from "../config";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: getEnvFilePath(), isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: createTypeOrmOptions }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

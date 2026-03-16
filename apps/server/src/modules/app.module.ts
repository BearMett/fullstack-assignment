import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { createTypeOrmOptions, getEnvFilePath, validateEnv } from "../config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { MeetingsModule } from "./meetings/meetings.module";
import { ApplicationsModule } from "./applications/applications.module";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: getEnvFilePath(), isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({ useFactory: createTypeOrmOptions }),
    AuthModule,
    MeetingsModule,
    ApplicationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../../entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtTokenService } from "./jwt-token.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthService, JwtTokenService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtTokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}

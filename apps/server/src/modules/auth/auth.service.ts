import { AuthTokenDto, SignInDto, SignUpDto, UserRole } from "@packages/shared";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../entity";
import { DUPLICATE_EMAIL_MESSAGE, INVALID_CREDENTIALS_MESSAGE } from "./auth.constants";
import { JwtTokenService } from "./jwt-token.service";
import { hashPassword, verifyPassword } from "./password.util";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtTokenService: JwtTokenService
  ) {}

  async register(payload: SignUpDto): Promise<AuthTokenDto> {
    const existingUser = await this.userRepository.findOne({ where: { email: payload.email } });

    if (existingUser) {
      throw new ConflictException(DUPLICATE_EMAIL_MESSAGE);
    }

    const user = this.userRepository.create({
      email: payload.email,
      password: hashPassword(payload.password),
      name: payload.name,
      role: UserRole.USER,
    });

    const savedUser = await this.userRepository.save(user);
    return this.toAuthResponse(savedUser);
  }

  async login(payload: SignInDto): Promise<AuthTokenDto> {
    const user = await this.userRepository.findOne({ where: { email: payload.email } });

    if (!user || !verifyPassword(payload.password, user.password)) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.toAuthResponse(user);
  }

  private toAuthResponse(user: User): AuthTokenDto {
    return {
      token: this.jwtTokenService.sign({ userId: user.id, role: user.role }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}

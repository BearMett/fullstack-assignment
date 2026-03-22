import { AuthTokenDto, SignInDto, SignUpDto, UserListItemDto, UserRole } from "@packages/shared";
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
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

    if (!user || !user.password || !verifyPassword(payload.password, user.password)) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.toAuthResponse(user);
  }

  async listUsers(): Promise<UserListItemDto[]> {
    const users = await this.userRepository.find({
      order: { id: "ASC" },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone ?? "",
      role: user.role,
    }));
  }

  async simpleLogin(userId: number): Promise<AuthTokenDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException("사용자를 찾을 수 없습니다");
    }

    return this.toAuthResponse(user);
  }

  async simpleRegister(name: string, phone?: string): Promise<AuthTokenDto> {
    const user = this.userRepository.create({
      name,
      phone,
      role: UserRole.USER,
    });

    const savedUser = await this.userRepository.save(user);
    return this.toAuthResponse(savedUser);
  }

  private toAuthResponse(user: User): AuthTokenDto {
    return {
      token: this.jwtTokenService.sign({ userId: user.id, role: user.role }),
      user: {
        id: user.id,
        email: user.email ?? "",
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}

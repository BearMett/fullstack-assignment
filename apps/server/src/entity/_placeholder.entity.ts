/**
 * ⚠️ 이 파일은 TypeORM 설정이 정상 동작하도록 유지되는 플레이스홀더입니다.
 * 실제 Entity를 구현한 뒤 이 파일과 index.ts의 export를 삭제해 주세요.
 */
import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("_placeholder")
export class _Placeholder {
  @PrimaryGeneratedColumn()
  id: number;
}

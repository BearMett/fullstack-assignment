# 백엔드 서버 (NestJS)

NestJS 기반의 백엔드 API 서버입니다.

## 📂 프로젝트 구조

```
apps/server/
├── src/
│   ├── config/              # 환경변수, TypeORM 설정
│   ├── constants/           # API prefix, DB 경로 상수
│   ├── entity/              # TypeORM 엔티티
│   │   └── *.entity.ts             # 실제 TypeORM 엔티티
│   ├── modules/
│   │   ├── app.module.ts    # 루트 모듈
│   │   └── app.middleware.ts # Global Prefix, Pipes, CORS, Swagger 설정
│   └── main.ts
└── data/
    └── assignment.sqlite    # SQLite DB
```

---

## 🗄️ 데이터베이스

- **타입**: SQLite (better-sqlite3)
- **위치**: `data/assignment.sqlite`
- **설정**: `src/config/typeorm.config.ts`

**중요**: 새로운 엔티티를 만들면 `src/entity/index.ts`에서 반드시 export 해야 합니다.

---

## 🚀 실행 방법

```bash
# 개발 모드 (루트에서)
pnpm start:dev

# 또는 apps/server 에서 직접
pnpm dev
```

## 테스트

- 기본 서버 테스트 러너는 Jest입니다.
- 추가 인프라 검증용 Vitest 설정은 `vitest.config.ts`와 `src/**/*.vitest.spec.ts`에 있습니다.

---

## 📚 참고 문서

- [NestJS 공식 문서](https://docs.nestjs.com/)
- [TypeORM 공식 문서](https://typeorm.io/)

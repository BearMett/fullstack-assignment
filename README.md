# 상상단 단톡방 모임 신청 시스템

> 📋 과제 요구사항은 [ASSIGNMENT.md](./ASSIGNMENT.md)를 참고해주세요.

---

## 로컬 실행 방법

### 1. 사전 요구사항

- Node.js 22 이상
- pnpm (`npm install -g pnpm`)

### 2. 설치

```bash
pnpm install
```

### 3. 환경 변수 설정

```bash
# 백엔드
cp apps/server/.env.example apps/server/.env

# 프론트엔드
cp apps/web/.env.example apps/web/.env
```

### 4. 개발 서버 실행

```bash
# 백엔드 + 프론트엔드 동시 실행
pnpm dev

# 개별 실행
pnpm start:dev   # 백엔드 (http://localhost:4000/api)
pnpm dev:web     # 프론트엔드 (http://localhost:3000)
```

---

## 구현 중 주요 고민 사항 및 해결 방법

> 구현하면서 고민했던 기술적 의사결정, 문제 해결 과정 등을 자유롭게 작성해주세요.

---

## 데이터베이스 설계

> ERD 또는 테이블 구조를 설명해주세요.

---

## 미구현 항목 및 개선 아이디어

> 시간 관계상 구현하지 못한 기능이나 추가 개선 방향을 작성해주세요.

---

## 과제 소요 시간

> 대략적인 작업 시간을 적어주세요.

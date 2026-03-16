# 데이터 모델 소스 오브 트루스 (MET-194)

이 문서는 `User`, `Meeting`, `Application`의 **영속 모델(저장 스키마)** 과 **비영속/표현 모델(계산값)** 의 경계를 고정한다.

## 1) 범위와 원칙

- 이 문서는 저장 대상 컬럼, PK/FK/UNIQUE 제약, enum 값의 단일 기준이다.
- `isRecruiting`, `displayStatus`, `resultMessage`, 각종 집계 카운트는 저장하지 않고 계산한다.
- 결과 공개 정책은 `announcementDate` 기준으로 결정하며, 공개 여부를 나타내는 별도 저장 컬럼은 두지 않는다.

## 2) Enum 정의 (값 고정)

### `role` (User)

- `user`
- `admin`

### `category` (Meeting)

- `READING`
- `EXERCISE`
- `WRITING`
- `ENGLISH`

### `status` (Application)

- `PENDING`
- `SELECTED`
- `REJECTED`

## 3) 엔터티별 영속 필드

## `User`

| 컬럼 | 타입(권장) | NULL | 제약 | 설명 |
|---|---|---|---|---|
| `id` | integer | NO | PK, auto-increment | 사용자 식별자 |
| `email` | varchar | NO | UNIQUE | 로그인/식별 이메일 |
| `password` | varchar | NO |  | 해시된 비밀번호 |
| `name` | varchar | NO |  | 사용자 이름 |
| `role` | enum(`user`,`admin`) | NO |  | 사용자 역할 |
| `createdAt` | datetime | NO | default now | 생성 시각 |
| `updatedAt` | datetime | NO | default now/on update | 수정 시각 |

## `Meeting`

| 컬럼 | 타입(권장) | NULL | 제약 | 설명 |
|---|---|---|---|---|
| `id` | integer | NO | PK, auto-increment | 모임 식별자 |
| `title` | varchar | NO |  | 모임 제목 |
| `category` | enum(`READING`,`EXERCISE`,`WRITING`,`ENGLISH`) | NO |  | 모임 종류 코드 |
| `description` | text | NO |  | 모임 설명 |
| `maxParticipants` | integer | NO | CHECK (`maxParticipants >= 1`) | 모집 인원 |
| `announcementDate` | date | NO |  | 발표일 |
| `createdAt` | datetime | NO | default now | 생성 시각 |
| `updatedAt` | datetime | NO | default now/on update | 수정 시각 |

## `Application`

| 컬럼 | 타입(권장) | NULL | 제약 | 설명 |
|---|---|---|---|---|
| `id` | integer | NO | PK, auto-increment | 신청 식별자 |
| `userId` | integer | NO | FK -> `User.id` | 신청 사용자 |
| `meetingId` | integer | NO | FK -> `Meeting.id` | 신청 대상 모임 |
| `status` | enum(`PENDING`,`SELECTED`,`REJECTED`) | NO | default `PENDING` | 신청 상태 |
| `createdAt` | datetime | NO | default now | 신청 시각 |
| `updatedAt` | datetime | NO | default now/on update | 상태 변경 시각 |

### `Application` 제약 (고정)

- UNIQUE(userId, meetingId)
  - 동일 사용자의 동일 모임 중복 신청 방지
  - 신청 취소는 hard delete를 전제로 하며, 삭제 후 재신청 가능

## 4) 관계(ERD 규칙)

- `User` 1 --- N `Application`
  - `Application.userId`는 `User.id` 참조
- `Meeting` 1 --- N `Application`
  - `Application.meetingId`는 `Meeting.id` 참조
- 결과적으로 `User` N --- N `Meeting` 관계를 `Application`이 중간 테이블로 해소

## 5) 비영속(계산/표현 전용) 값

아래 값은 API/서비스 레이어에서 계산하며 DB 컬럼으로 저장하지 않는다.

### 모집 상태

- `isRecruiting: boolean`
  - 계산식: `announcementDate > now()` 이면 `true`, 아니면 `false`

### 카테고리 표시 라벨

- 저장값은 `READING` / `EXERCISE` / `WRITING` / `ENGLISH`
- 사용자 화면 표시는 각각 `독서` / `운동` / `기록` / `영어`로 매핑한다

### 사용자 노출용 상태

- `displayStatus: "PENDING" | "SELECTED" | "REJECTED"`
  - 사용자 응답에서만 사용되는 표시 상태
  - 발표일 이전(`announcementDate > now()`)에는 실제 `status`와 무관하게 `PENDING`으로 마스킹 가능

- `resultMessage?: string`
  - 사용자 안내 문구
  - 예: 발표일 이전 `"발표일에 결과가 공개됩니다"`, 발표일 이후 미처리 `"결과 대기중"`

### 집계 카운트

- `applicantCount`
- `selectedCount`
- `rejectedCount`
- `pendingCount`

모두 쿼리 집계/계산값이며 저장 컬럼이 아니다.

## 6) 결과 공개 정책 (비영속 정책)

- 결과 공개 여부는 `announcementDate` 기반 정책으로만 결정한다.
- 기준:
  - `announcementDate <= now()` 이면 결과 공개 가능
  - `announcementDate > now()` 이면 사용자에게 결과 비공개(마스킹)
- 즉, `isResultVisible`, `displayStatus`, `resultMessage` 같은 값은 정책 계산 결과이며 영속 저장 대상이 아니다.

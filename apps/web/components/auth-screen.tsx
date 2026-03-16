"use client";

import { type SignInDto, type SignUpDto } from "@packages/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { extractApiErrorMessage } from "@/lib/api-client";
import { useLoginMutation, useRegisterMutation } from "@/lib/react-query/use-auth";
import { GuestOnly } from "@/components/route-guard";

type AuthMode = "login" | "register";

type FormState = {
  name: string;
  email: string;
  password: string;
};

type SubmitEvent = {
  preventDefault: () => void;
};

const demoAccounts = [
  {
    label: "관리자 계정",
    email: "admin@sangsang.com",
    password: "Password1!",
  },
  {
    label: "회원 계정",
    email: "user@example.com",
    password: "Password1!",
  },
];

const screenCopy = {
  login: {
    eyebrow: "Session",
    title: "오늘의 모임 공지를 확인하려면 로그인하세요",
    description:
      "관리자와 회원 데모 계정으로 바로 흐름을 검증할 수 있고, 로그인에 성공하면 보호된 모임 화면으로 곧장 이동합니다.",
    submitLabel: "로그인",
    pendingLabel: "로그인 중...",
    helperTitle: "빠른 확인용 데모 계정",
    helperDescription: "버튼 한 번으로 입력값을 채워 인증 흐름을 바로 점검할 수 있습니다.",
    alternateQuestion: "아직 계정이 없나요?",
    alternateHref: "/register",
    alternateLabel: "회원가입으로 이동",
    errorFallback: "로그인에 실패했습니다",
    highlights: [
      "백엔드가 반환한 인증 오류 문구를 그대로 노출합니다.",
      "성공 시 세션을 저장하고 즉시 보호된 화면으로 이동합니다.",
      "다음 방문에서도 로그인 상태를 이어갈 수 있습니다.",
    ],
  },
  register: {
    eyebrow: "Join",
    title: "새 계정으로 상상단 모임에 바로 합류하세요",
    description:
      "이름, 이메일, 비밀번호만 입력하면 회원가입 직후 세션이 저장되고 보호된 모임 화면으로 연결됩니다.",
    submitLabel: "회원가입",
    pendingLabel: "가입 처리 중...",
    helperTitle: "가입 후 바로 가능한 일",
    helperDescription: "첫 사용자 흐름을 검증하기 위한 최소한의 보호된 공간까지 이어집니다.",
    alternateQuestion: "이미 계정이 있나요?",
    alternateHref: "/login",
    alternateLabel: "로그인으로 이동",
    errorFallback: "회원가입에 실패했습니다",
    highlights: [
      "중복 이메일 오류를 서버 응답 그대로 안내합니다.",
      "회원가입 직후 별도 재로그인 없이 세션을 이어갑니다.",
      "이후 모임 탐색 화면이 붙을 자리만 가볍게 확보합니다.",
    ],
  },
} as const;

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    password: "",
  });
  const copy = screenCopy[mode];
  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();
  const mutation = mode === "register" ? registerMutation : loginMutation;

  const errorMessage = useMemo(() => {
    if (!mutation.error) {
      return null;
    }

    return extractApiErrorMessage(mutation.error, copy.errorFallback);
  }, [copy.errorFallback, mutation.error]);

  const handleChange = <Field extends keyof FormState>(field: Field, value: FormState[Field]) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleDemoFill = (email: string, password: string) => {
    setFormState((current) => ({
      ...current,
      email,
      password,
    }));
  };

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    if (mode === "register") {
      const payload: SignUpDto = {
        name: formState.name.trim(),
        email: formState.email.trim(),
        password: formState.password,
      };

      registerMutation.mutate(payload, {
        onSuccess: () => {
          router.replace("/meetings");
        },
      });
      return;
    }

    const payload: SignInDto = {
      email: formState.email.trim(),
      password: formState.password,
    };

    loginMutation.mutate(payload, {
      onSuccess: () => {
        router.replace("/meetings");
      },
    });
  };

  return (
    <GuestOnly>
      <main className="page-shell">
        <div className="auth-layout">
          <section className="hero-card stack-lg">
            <span className="section-kicker">{copy.eyebrow}</span>
            <div className="stack-md">
              <h1 className="section-title">{copy.title}</h1>
              <p className="section-description">{copy.description}</p>
            </div>

            <div className="feature-list">
              {copy.highlights.map((highlight, index) => (
                <div className="feature-item" key={highlight}>
                  <span className="feature-index">0{index + 1}</span>
                  <div className="feature-copy">
                    <strong>{highlight}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="stack-md">
              <div className="stack-sm">
                <p className="eyebrow-copy">{copy.helperTitle}</p>
                <p className="sample-meta">{copy.helperDescription}</p>
              </div>

              {mode === "login" ? (
                <div className="sample-grid">
                  {demoAccounts.map((account) => (
                    <button
                      className="sample-button"
                      key={account.email}
                      onClick={() => handleDemoFill(account.email, account.password)}
                      type="button"
                    >
                      <span>
                        <span className="sample-label">{account.label}</span>
                        <span className="sample-value">{account.email}</span>
                      </span>
                      <span className="sample-value">{account.password}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="credential-list">
                  <div className="feature-item">
                    <span className="feature-index">1</span>
                    <div className="feature-copy">
                      <strong>가입이 끝나면 즉시 보호된 `/meetings` 화면으로 이동합니다.</strong>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-index">2</span>
                    <div className="feature-copy">
                      <strong>로그아웃 전까지 세션이 유지되어 새로고침에도 상태가 이어집니다.</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="auth-card stack-lg">
            <div className="auth-header stack-sm">
              <span className="section-kicker">{copy.submitLabel}</span>
              <div className="stack-sm">
                <h2 className="section-title">{copy.submitLabel} 준비가 끝났습니다</h2>
                <p className="section-description">필수 정보만 입력하면 바로 다음 단계로 이어집니다.</p>
              </div>
            </div>

            {errorMessage ? <p className="status-banner">{errorMessage}</p> : null}

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === "register" ? (
                <label className="auth-field">
                  <span className="auth-label">이름</span>
                  <input
                    autoComplete="name"
                    className="auth-input"
                    onChange={(event) => handleChange("name", event.target.value)}
                    placeholder="이름을 입력하세요"
                    required
                    type="text"
                    value={formState.name}
                  />
                </label>
              ) : null}

              <label className="auth-field">
                <span className="auth-label">이메일</span>
                <input
                  autoComplete="email"
                  className="auth-input"
                  onChange={(event) => handleChange("email", event.target.value)}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={formState.email}
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">비밀번호</span>
                <input
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="auth-input"
                  minLength={8}
                  onChange={(event) => handleChange("password", event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  type="password"
                  value={formState.password}
                />
              </label>

              <button className="primary-button" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? copy.pendingLabel : copy.submitLabel}
              </button>
            </form>

            <div className="divider-row">또는</div>

            <div className="auth-footer stack-sm">
              <p className="meta-copy">{copy.alternateQuestion}</p>
              <Link className="ghost-link" href={copy.alternateHref}>
                {copy.alternateLabel}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </GuestOnly>
  );
}

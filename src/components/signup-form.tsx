import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    const { data: { session }, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          display_name: name,
        }
      }
    })

    if (error) {
      if (error.code === "invalid_credentials") {
        toast.error("이메일 형식이 올바르지 않습니다.");
      } else if (error.code === "email_already_in_use") {
        toast.error("이미 사용중인 이메일입니다.");
      } else {
        toast.error("회원가입 실패: " + error.message);
      }
      setIsLoading(false);
      return;
    }

    // [Rule 16] Proactive Redirect Fix: 
    // 수파베이스는 회원가입 시 자동 로그인을 시도할 수 있습니다. 
    // '로그인 페이지'로 명확히 이동시키기 위해 혹시 모를 세션을 명시적으로 종료합니다.
    if (session) {
      await supabase.auth.signOut();
    }

    toast.success("회원가입 성공! 로그인을 진행해주세요.");
    // [Vibe Fix] SPA 내비게이션보다 강력한 브라우저 레벨 페이지 이동으로 비밀번호 저장 유도
    window.location.href = "/login-page";
    setIsLoading(false);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">계정 생성</CardTitle>
          <CardDescription>
            사용하실 이메일과 이름을 입력해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* [Rule 30] 브라우저 자동완성 엔진을 위한 네이티브 속성 보강 */}
          <form onSubmit={onSubmit} method="POST" action="#">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">이름</FieldLabel>
                <Input
                  name="name"
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  required
                  autoComplete="name"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input
                  name="email"
                  id="email"
                  type="email"
                  placeholder="da_pal_a@example.com"
                  required
                  autoComplete="username"
                />
              </Field>
              <Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                    <Input
                      name="password"
                      id="password"
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="8자 이상"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      비밀번호 확인
                    </FieldLabel>
                    <Input
                      name="confirm-password"
                      id="confirm-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="동일하게 입력"
                    />
                  </Field>
                </div>
                <FieldDescription>
                  비밀번호 보안 유지를 위해 8자 이상을 권장합니다.
                </FieldDescription>
              </Field>
              <Field>
                <Button disabled={isLoading} type="submit" className="w-full">
                  {isLoading ? "처리 중..." : "회원가입 완료"}
                </Button>
                <FieldDescription className="text-center text-xs mt-2">
                  이미 계정이 있으신가요?{" "}
                  <Link href="/login-page" className="underline underline-offset-4 hover:text-primary transition-colors">로그인 하러 가기</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        회원가입 시 <Link href="https://gall.dcinside.com/mgallery/board/view/?id=stockus&no=7403529&exception_mode=recommend&search_head=320&page=1">이용약관 및 개인정보처리방침{" "}</Link>
        에 동의하는 것으로 간주됩니다.
      </FieldDescription>
    </div>
  )
}

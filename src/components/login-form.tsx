import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.code === "invalid_credentials") {
        toast.error("이메일 또는 비밀번호가 일치하지 않습니다.");
      } else if (error.code === "email_not_confirmed") {
        toast.error("이메일 인증이 필요합니다.");
      } else {
        toast.error("로그인 실패");
      }
      setIsLoading(false);
      return;
    }

    toast.success("로그인 성공");
    window.location.href = "/";
    setIsLoading(false);
  }
  return (
    /* [Rule 30] 브라우저 자동완성 엔진을 위한 네이티브 속성(action, method) 보강 */
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit} method="POST" action="#">
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="text-sm text-balance text-muted-foreground line-clamp-2">
            다팔아이개새캌 엔터프라이즈
          </p>
          <p className="text-sm text-balance text-muted-foreground line-clamp-2">
            이기영쓰들아.
          </p>
        </div>
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
          <div className="flex items-center">
            <FieldLabel htmlFor="password">비밀번호</FieldLabel>
            <Link
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
            </Link>
          </div>
          <Input 
            name="password" 
            id="password" 
            type="password" 
            placeholder="비밀번호를 입력해주세요." 
            required 
            autoComplete="current-password"
          />
        </Field>
        <Field>
          <Button disabled={isLoading} type="submit">로그인</Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            계정이 없으신가요?{" "}
            <Link href="/signup-page" className="underline underline-offset-4">
              회원가입
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}

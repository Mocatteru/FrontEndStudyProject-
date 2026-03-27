import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { ButtonProps } from "@base-ui/react/button"
import { VariantProps } from "class-variance-authority"

/**
 * [Senior] AlertDialog(경고창) 통합 버튼 컴포넌트
 * - 프로젝트의 디자인 가이드를 준수하며, 버튼 클릭 시 확인 창을 띄웁니다.
 */
interface AlertDialogButtonProps extends Omit<ButtonProps, 'title'>, VariantProps<typeof buttonVariants> {
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    children: React.ReactNode;
}

export function AlertDialogButton({
    title,
    description,
    onConfirm,
    children,
    confirmText = "확인",  // [Rule 1] K-UX: 기본값 한글화
    cancelText = "취소",    // [Rule 1] K-UX: 기본값 한글화
    ...props
}: AlertDialogButtonProps) {
    return (
        <AlertDialog>
            {/* [Rule 21] Safe Chaining: render prop을 사용하여 중첩 버튼(button > button) 에러 방지 */}
            <AlertDialogTrigger
                render={<Button {...props}>{children}</Button>}
            />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    {/* [Rule 2] Visual Hierarchy: 파괴적 액션의 경우에는 destructive 적용 권장 */}
                    <AlertDialogAction
                        onClick={onConfirm}
                        variant={props.variant === 'destructive' ? 'destructive' : 'default'}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

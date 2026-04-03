import { useState, useCallback, useEffect, useRef } from "react";
import { UserProfile, useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export const useProfileForm = () => {
    const { fetchProfile, saveProfile } = useUiStore();
    const { user } = useAuthStore();

    const [form, setForm] = useState<UserProfile>({
        userName: "",
        userEmail: "",
        userDepartment: "",
        userRole: "USER",
        userAvatar: "",
        id: "",
    });
    const [initialForm, setInitialForm] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const previewUrlRef = useRef<string | null>(null);

    // [Memory Management] 이전 프리뷰 URL 해제
    const revokePreview = useCallback(() => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!user?.id || user.id === "undefined") return;

        setIsLoading(true);
        fetchProfile(user.id).then((data) => {
            if (data) {
                setForm(data);
                setInitialForm(data); // 초기값 저장 (Reset용)
            }
            setIsLoading(false);
        });

        return () => revokePreview();
    }, [fetchProfile, user?.id, revokePreview]);

    const handleChange = useCallback((field: keyof UserProfile, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setIsEditing(true);
    }, []);

    const handleAvatarChange = useCallback((file: File) => {
        revokePreview();
        const url = URL.createObjectURL(file);
        previewUrlRef.current = url;
        
        setAvatarFile(file);
        setForm((prev) => ({ ...prev, userAvatar: url }));
        setIsEditing(true);
    }, [revokePreview]);

    const validate = useCallback((): boolean => {
        if (!form.userName.trim()) {
            toast.error("이름은 필수 항목입니다.");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (form.userEmail && !emailRegex.test(form.userEmail)) {
            toast.error("유효한 이메일 형식이 아닙니다.");
            return false;
        }
        return true;
    }, [form.userName, form.userEmail]);

    const handleSave = useCallback(async () => {
        if (!validate()) return;

        setIsSaving(true);
        try {
            await saveProfile(form, avatarFile);
            setInitialForm(form); // 저장된 값을 새로운 초기값으로 설정
            setAvatarFile(null);
            setIsEditing(false);
            toast.success("프로필 저장 완료", {
                description: "클라우드 설정 동기화가 완료되었습니다.",
            });
        } catch {
            toast.error("저장 중 오류 발생", {
                description: "서버 연결 상태를 확인해주세요.",
            });
        } finally {
            setIsSaving(false);
        }
    }, [form, avatarFile, saveProfile, validate]);

    const handleReset = useCallback(() => {
        if (initialForm) {
            revokePreview();
            setForm(initialForm);
            setAvatarFile(null);
            setIsEditing(false);
            toast.info("변경 사항 취소됨");
        }
    }, [initialForm, revokePreview]);

    return {
        form,
        isEditing,
        isSaving,
        isLoading,
        handleChange,
        handleAvatarChange,
        handleSave,
        handleReset,
    };
};

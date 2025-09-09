/**
 * Register Form Component - Basic wrapper
 * This is a simplified version that redirects to the main registration pages
 */

import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const router = useRouter();

  const handleIndividualRegister = () => {
    router.push("/register?type=individual");
  };

  const handleBusinessRegister = () => {
    router.push("/register?type=business");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Hesap Oluştur</h2>
          <p className="text-gray-600 mt-2">Hesap türünüzü seçin</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleIndividualRegister}
            className="w-full"
          >
            Bireysel Hesap
          </Button>

          <Button
            variant="outline"
            onClick={handleBusinessRegister}
            className="w-full"
          >
            İşletme Hesabı
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Zaten hesabınız var mı?{" "}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:underline"
            >
              Giriş Yap
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

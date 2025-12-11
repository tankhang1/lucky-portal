import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/react-query/queries/auth/auth";

// 1. Define your Validation Schema
const formSchema = z.object({
  username: z.string().min(1, { message: "Tên đăng nhập không được để trống" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

// 2. Infer the TypeScript type from the schema
type FormData = z.infer<typeof formSchema>;

const AuthPage = () => {
  const navigate = useNavigate();
  const { mutate: login, isPending: isLoadingLogin } = useLogin();
  // 3. Initialize hook with Zod Resolver and TypeScript type
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // 4. Define the submit handler with the correct Type
  const onSubmit = async (data: FormData) => {
    console.log("Valid Data Submitted:", data);
    login(
      {
        username: data.username,
        password: data.password,
      },
      {
        onSuccess: (value) => {
          localStorage.setItem("token", value.token);
          navigate("/main/program");
        },
        onError: () => {
          alert("Tài khoản/ mật khẩu bị sai!");
        },
      }
    );
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-3/4 min-w-[400px] max-w-md shadow-md border border-gray-200">
        <CardHeader>
          <img
            src="https://www.mappacific.com/wp-content/uploads/2021/08/logo.png"
            className="w-32 mx-auto mb-4 object-contain"
            alt="Mappacific Logo"
          />

          <CardTitle className="text-xl font-semibold text-center">
            Chào mừng bạn đến với Mappacific
          </CardTitle>
          <CardDescription className="text-center">
            Đăng nhập để tiếp tục
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                placeholder="admin"
                {...register("username")} // No need for manual rules here, Zod handles it
              />
              {errors.username && (
                <span className="text-sm text-red-500 font-medium">
                  {errors.username.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <span className="text-sm text-red-500 font-medium">
                  {errors.password.message}
                </span>
              )}
            </div>

            <Button
              className="w-full"
              variant={"default"}
              type="submit"
              disabled={isLoadingLogin} // Disable button while submitting
            >
              {isLoadingLogin ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-center text-gray-600">
            Chưa có tài khoản?{" "}
            <a href="/register" className="underline hover:text-primary">
              Đăng ký
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;

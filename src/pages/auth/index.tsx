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

const AuthPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-3/4 min-w-[400px] max-w-md shadow-md border border-gray-200">
        <CardHeader>
          <img
            src="https://www.mappacific.com/wp-content/uploads/2021/08/logo.png"
            className="w-32 mx-auto mb-4 object-contain"
          />

          <CardTitle className="text-xl font-semibold text-center">
            Chào mừng bạn đến với Mappacific
          </CardTitle>
          <CardDescription className="text-center">
            Đăng nhập để tiếp tục
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button
              className="w-full"
              variant={"default"}
              onClick={() => navigate("/main/program")}
            >
              Đăng nhập
            </Button>
          </form>
          <p className="mt-4 text-sm text-center text-gray-600">
            Chưa có tài khoản? <a href="/register">Đăng ký</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;

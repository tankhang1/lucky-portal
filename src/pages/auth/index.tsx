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

const AuthPage = () => {
  return (
    <div className="flex max-h-screen items-center justify-center">
      <Card className="w-3/4 min-w-[400px] max-w-md shadow-md border border-gray-200">
        <CardHeader>
          <img
            src="https://www.mappacific.com/wp-content/uploads/2021/08/logo.png"
            className="w-32 mx-auto mb-4 object-contain"
          />

          <CardTitle className="text-xl font-semibold text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">
            Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full" variant={"default"}>
              Sign In
            </Button>
          </form>
          <p className="mt-4 text-sm text-center text-gray-600">
            Don’t have an account? <a href="/register">Sign up</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;

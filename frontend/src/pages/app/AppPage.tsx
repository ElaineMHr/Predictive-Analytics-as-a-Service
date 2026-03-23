import { TypewriterText } from "@/components/app/Typewriter";
import { Fox } from "@/components/watermark/Fox";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

export default function AppPage() {
  const [step, setStep] = useState<1 | 2>(1);
  return (
    <div className="min-h-screen flex bg-background">
      <div className="relative w-3/4 border-r p-8 overflow-hidden">
        <Fox
          aria-hidden
          size="80%"
          className="pointer-events-none absolute inset-0 m-auto opacity-[0.12]"
          style={{ color: "hsl(var(--sidebar-foreground))" }}
          nodeFill="hsl(var(--sidebar-foreground))"
        />
        <div className="relative z-10 h-full flex items-center justify-center flex-col select-none">
          <div className="font-mono text-4xl md:text-6xl text-muted-foreground tracking-tight">
            <TypewriterText
              text="< Predictive_Analytics />"
              onDone={useCallback(() => setStep(2), [])}
            />
          </div>
          {step >= 2 && (
            <div className="font-mono text-xl md:text-2xl text-muted-foreground tracking-tight pt-6">
              <TypewriterText text="// turning data into decisions" />
            </div>
          )}
        </div>
      </div>
      <div className="w-1/4 min-h-screen flex flex-col gap-4 bg-[hsl(var(--sidebar-background))] min-w-[360px]">
        <div className="p-8 h-full">
          <Card className="w-full flex flex-col h-full">
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Placeholder for authentication. Click "Login" to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@doe.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href=""
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input id="password" type="password" required />
                  </div>
                </div>
              </form>
              {/* <Button type="submit" className="w-full">
              Login
            </Button> */}
              <Link to="/dashboard" className="w-full mt-6 block">
                <Button className="w-full">Login</Button>
              </Link>
            </CardContent>
            <CardFooter className="mt-auto flex-col gap-2">
              <div className="text-sm flex gap-1 items-center">
                <div>Not a member?</div>
                <button className="underline decoration-white/50 decoration-dotted">
                  Sign up now
                </button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

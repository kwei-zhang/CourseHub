import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="grid flex-1 lg:grid-cols-2" style={{ minHeight: "calc(100vh - 4rem)" }}>
      {/* Left: Promotion / marketing */}
      <div className="hidden lg:flex flex-col justify-between bg-muted p-10 xl:p-12">
        <div className="space-y-6">
          <blockquote className="space-y-2 border-l-4 border-primary pl-6 text-lg italic text-muted-foreground xl:text-xl">
            <p>
              &ldquo;LRMS made it easy to organise course materials and track
              student progress. Everything our team needs is in one place.&rdquo;
            </p>
            <footer className="text-sm font-medium not-italic text-foreground">
              — Instructor, University of Toronto
            </footer>
          </blockquote>
        </div>
        <p className="text-sm text-muted-foreground">
          Learning Resource Management System — centralising resources for students, TAs, and instructors.
        </p>
      </div>

      {/* Right: Login form */}
      <div className="flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access LRMS
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

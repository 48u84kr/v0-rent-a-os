import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-destructive/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-destructive/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
            <span className="text-primary-foreground font-bold text-xl">rA</span>
          </div>
        </div>

        <Card className="border-border/50 shadow-xl shadow-destructive/5 text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Authentication Error</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Something went wrong during authentication. This could be due to an expired link, an invalid token, or a configuration issue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground leading-relaxed">
              If this problem persists, please try signing in again or contact support for assistance.
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild className="w-full rounded-xl h-11">
              <Link href="/auth/login">Try again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-xl h-11 bg-transparent">
              <Link href="/auth/sign-up">Create new account</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

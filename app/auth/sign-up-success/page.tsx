import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
            <span className="text-primary-foreground font-bold text-xl">rA</span>
          </div>
        </div>

        <Card className="border-border/50 shadow-xl shadow-primary/5 text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              We sent you a confirmation link. Please check your inbox and click the link to verify your email address and activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground leading-relaxed">
              If you don&apos;t see the email, check your spam folder. The link expires in 24 hours.
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full rounded-xl h-11">
              <Link href="/auth/login">Back to login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  console.log("MAMA IMPORT ENV: ", import.meta.env)
  return (
    <>
      <PageMeta
        title="Sign In | BRS Academy"
        description="Sign in to your BRS Academy Chess Training Dashboard account"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}

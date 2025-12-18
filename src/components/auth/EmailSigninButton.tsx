import { ChangeEvent, useState } from "react";
import {
    EyeCloseIcon,
    EyeIcon,
  } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { loginByEmail } from "../../api/auth/authService";
import { tokenStorage } from "../../api/tokenStorage";
import { useNavigate } from "react-router";
  
  export default function EmailSignInButton() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginForm,setLoginForm]=useState({
        email:"",
        password:""
    });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
          const { access_token } = await loginByEmail(loginForm);
          console.log(access_token)
          tokenStorage.set(access_token);
          navigate("/");
        } catch (err) {
          console.error(err);
          // show error to user
        } finally {
          setLoading(false);
        }
      };
    const handleChange = (e:ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginForm((prev) => ({
          ...prev,
          [name]: value, // dynamically update the key
        }));
      };
    return (
        <form onSubmit={submit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input placeholder="example@gmail.com" name="email" value={loginForm.email} onChange={handleChange}/>
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={loginForm.password}
                      placeholder="Enter your password"
                      onChange={handleChange}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                <div>
                <button type="submit" disabled={loading} className="w-full">
                  <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                  </Button>
                  </button>
                </div>
              </div>
            </form>

    );
  }
  
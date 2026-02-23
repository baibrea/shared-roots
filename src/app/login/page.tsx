import Link from "next/link";

export default function LoginPage() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {};

  return (
    <div className="relative min-h-screen bg-[#CAD7CA]">
        <Link href="/" className="absolute top-4 left-4 text-[#374426] text-xl font-bold">
            Shared Roots
        </Link>
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-12 rounded-4xl bg-[#f9f8f4] shadow-2xl shadow-">
                <h1 className="text-2xl font-bold mb-2 text-center text-[#3A433A]">
                    Welcome Back!
                </h1>
                <p className="text-center mb-8 text-[#3A433A]">
                    Login to continue tracking your roots.
                </p>

                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-[#3A433A]">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
                            placeholder="Email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-[#3A433A]">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
                            placeholder="Password"
                        />
                    </div>
                    {/* might implement */}
                    <div className="text-right mr-2">
                        <p className="text-sm text-[#3A433A]">
                            Forgot password?
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#698b6a] text-white py-2 my-1 rounded-3xl hover:opacity-90 transition disabled:opacity-50"
                    >
                            Login
                    </button>
                </form>

                <div>
                    <p className="mt-4 text-sm text-center text-black">
                        Don’t have an account?{" "}
                        <Link href="/signup" className="text-blue-600 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}

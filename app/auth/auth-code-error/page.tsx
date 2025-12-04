'use client'

import Link from 'next/link'

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
            <div className="text-center max-w-md p-8">
                <h1 className="text-4xl font-bold text-red-500 mb-4">Login Failed</h1>
                <p className="text-gray-300 mb-8">
                    We couldn't verify your login. This might happen if the login link expired or if there was a connection issue.
                </p>
                <Link
                    href="/login"
                    className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition"
                >
                    Try Again
                </Link>
            </div>
        </div>
    )
}

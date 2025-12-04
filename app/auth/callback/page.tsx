'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const handleAuth = async () => {
            const code = searchParams.get('code')
            const next = searchParams.get('next') ?? '/'

            if (code) {
                try {
                    const { error } = await supabase.auth.exchangeCodeForSession(code)
                    if (!error) {
                        router.push(next)
                        router.refresh()
                    } else {
                        console.error('Auth Error:', error)
                        router.push('/auth/auth-code-error')
                    }
                } catch (err) {
                    console.error('Auth Exception:', err)
                    router.push('/auth/auth-code-error')
                }
            } else {
                // No code, maybe already logged in or error
                router.push('/')
            }
        }
        handleAuth()
    }, [searchParams, router])

    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
            <div className="text-center">
                <h2 className="text-xl font-bold mb-2">Verifying Login...</h2>
                <p className="text-gray-400">Please wait while we connect you.</p>
            </div>
        </div>
    )
}

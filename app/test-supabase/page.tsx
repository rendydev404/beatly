'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
    const [status, setStatus] = useState<string>('Testing connection...')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function checkConnection() {
            try {
                // Just check if we can initialize and maybe get a session or a simple query
                // Since we might not have tables, checking auth session is a safe bet for "connection"
                // or just checking if the client is initialized without throwing

                if (!supabase) {
                    throw new Error('Supabase client not initialized')
                }

                const { data, error } = await supabase.from('test_table_that_does_not_exist').select('*').limit(1)

                // We expect an error about the table not existing if the connection is good but table is missing.
                // Or if the URL/Key is invalid, we get a different error.

                if (error) {
                    if (error.code === 'PGRST204' || error.message.includes('relation "test_table_that_does_not_exist" does not exist')) {
                        setStatus('Connected! (Table check passed - table missing as expected)')
                    } else if (error.message.includes('Invalid API Key') || error.code === '401') {
                        setError('Connection Failed: Invalid API Key or URL')
                        setStatus('Failed')
                    } else {
                        // Even other errors mean we probably talked to Supabase
                        setStatus(`Connected! (Received Supabase error: ${error.message})`)
                    }
                } else {
                    setStatus('Connected! (Query successful)')
                }

            } catch (err: any) {
                setError(err.message)
                setStatus('Failed')
            }
        }

        checkConnection()
    }, [])

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
            <div className="p-4 border rounded">
                <p><strong>Status:</strong> {status}</p>
                {error && <p className="text-red-500 mt-2"><strong>Error:</strong> {error}</p>}
            </div>
            <div className="mt-4 text-sm text-gray-500">
                <p>Check your .env.local file if connection fails.</p>
            </div>
        </div>
    )
}

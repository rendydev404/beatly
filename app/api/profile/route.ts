import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
    try {
        // Get auth token from header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')

        // Create client with service key
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

        // Get user from token
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Get subscription info
        const { data: subscription } = await supabaseClient
            .from('user_subscriptions')
            .select('plan_id, daily_usage')
            .eq('user_id', user.id)
            .single()

        // Get plan details
        let planDetails = null
        if (subscription?.plan_id) {
            const { data: plan } = await supabaseClient
                .from('plans')
                .select('name, daily_limit')
                .eq('id', subscription.plan_id)
                .single()
            planDetails = plan
        }

        // Get listening statistics
        const { count: totalSongsPlayed } = await supabaseClient
            .from('listening_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        // Get unique artists count
        const { data: artistsData } = await supabaseClient
            .from('listening_history')
            .select('artist_name')
            .eq('user_id', user.id)

        const uniqueArtists = new Set(artistsData?.map(item => item.artist_name) || [])

        // Get today's plays
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const { count: todayPlays } = await supabaseClient
            .from('listening_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('played_at', today.toISOString())

        // Get this week's plays
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const { count: weekPlays } = await supabaseClient
            .from('listening_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('played_at', weekAgo.toISOString())

        // Get top artist (most played)
        const artistCounts: Record<string, number> = {}
        artistsData?.forEach(item => {
            artistCounts[item.artist_name] = (artistCounts[item.artist_name] || 0) + 1
        })
        const topArtist = Object.entries(artistCounts)
            .sort((a, b) => b[1] - a[1])[0]

        // Estimate listening time (assume avg 3.5 minutes per song)
        const estimatedMinutes = (totalSongsPlayed || 0) * 3.5
        const estimatedHours = Math.floor(estimatedMinutes / 60)

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                avatar_url: user.user_metadata?.avatar_url || null,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || null
            },
            subscription: {
                plan_id: subscription?.plan_id || 'free',
                plan_name: planDetails?.name || 'Free',
                daily_limit: planDetails?.daily_limit || 25,
                daily_usage: subscription?.daily_usage || 0
            },
            stats: {
                total_songs_played: totalSongsPlayed || 0,
                unique_artists: uniqueArtists.size,
                today_plays: todayPlays || 0,
                week_plays: weekPlays || 0,
                estimated_hours: estimatedHours,
                top_artist: topArtist ? { name: topArtist[0], count: topArtist[1] } : null
            }
        })

    } catch (error) {
        console.error('Profile API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Get auth token from header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')

        // Create client with service key
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

        // Get user from token
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Parse form data
        const formData = await request.formData()
        const avatar = formData.get('avatar') as File | null
        const fullName = formData.get('full_name') as string | null

        const updates: { avatar_url?: string; full_name?: string } = {}

        // Handle avatar upload
        if (avatar && avatar.size > 0) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            if (!allowedTypes.includes(avatar.type)) {
                return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' }, { status: 400 })
            }

            // Validate file size (max 5MB)
            if (avatar.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: 'File too large. Maximum 5MB.' }, { status: 400 })
            }

            // Generate unique filename
            const ext = avatar.name.split('.').pop() || 'jpg'
            const fileName = `${user.id}/${Date.now()}.${ext}`

            // Convert to buffer
            const arrayBuffer = await avatar.arrayBuffer()
            const buffer = new Uint8Array(arrayBuffer)

            // Check if bucket exists, if not provide helpful error
            const { data: buckets } = await supabaseClient.storage.listBuckets()
            const avatarBucketExists = buckets?.some(b => b.name === 'avatars')

            if (!avatarBucketExists) {
                // Try to create the bucket
                const { error: createBucketError } = await supabaseClient.storage.createBucket('avatars', {
                    public: true,
                    fileSizeLimit: 5242880 // 5MB
                })

                if (createBucketError) {
                    console.error('Failed to create avatars bucket:', createBucketError)
                    return NextResponse.json({
                        error: 'Storage bucket "avatars" does not exist. Please create it in Supabase Dashboard → Storage with public access enabled.'
                    }, { status: 500 })
                }
            }

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(fileName, buffer, {
                    contentType: avatar.type,
                    upsert: true
                })

            if (uploadError) {
                console.error('Avatar upload error:', uploadError)
                return NextResponse.json({
                    error: `Failed to upload avatar: ${uploadError.message}`
                }, { status: 500 })
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from('avatars')
                .getPublicUrl(uploadData.path)

            updates.avatar_url = publicUrl
        }

        // Handle name update
        if (fullName !== null && fullName.trim() !== '') {
            updates.full_name = fullName.trim()
        }

        // Update user metadata if there are changes
        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
                user.id,
                {
                    user_metadata: {
                        ...user.user_metadata,
                        ...updates
                    }
                }
            )

            if (updateError) {
                console.error('User update error:', updateError)
                return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
            }
        }

        return NextResponse.json({
            success: true,
            updates,
            message: 'Profile updated successfully'
        })

    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

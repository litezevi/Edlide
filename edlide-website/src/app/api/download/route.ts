import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'

const R2_BUCKET = 'edlide-images'
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY_ID

const VERSION = '1.0.8'

const FILE_MAP: Record<string, string> = {
  arm64: `Edlide-${VERSION}.arm64.dmg`,
  x64: `Edlide-${VERSION}-x64.dmg`,
  win64: `Edlide-${VERSION}-x64.exe`,
  winarm64: `Edlide-${VERSION}.arm64.exe`,
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const file = searchParams.get('file')

  if (!file || !FILE_MAP[file]) {
    return NextResponse.json(
      { error: 'Invalid file parameter. Use "arm64" or "x64"' },
      { status: 400 }
    )
  }

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return NextResponse.json(
      { error: 'R2 credentials not configured' },
      { status: 500 }
    )
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: FILE_MAP[file],
  })

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })

  return NextResponse.json({ url: signedUrl })
}
